// ============================================================
// Page MCP SDK — Chrome Runtime Transport
// Cross-context communication via chrome.runtime messaging
// Used for: Content Script ↔ Extension Background/Popup
// ============================================================

import type { RpcRequest, RpcResponse, RpcMethod, ITransport } from '../types.js';

type Listener = (data: unknown) => void;
type RpcHandler = (request: RpcRequest) => Promise<RpcResponse>;

let idCounter = 0;
function generateId(): string {
    return `cr_${Date.now()}_${++idCounter}`;
}

// ---- Chrome Extension API type stubs ----
// These cover only the subset we need, to avoid requiring @types/chrome

interface ChromeRuntimeMessage {
    channel: string;
    type: 'rpc:request' | 'rpc:response' | 'event';
    payload: unknown;
    eventName?: string;
}

interface ChromeMessageSender {
    tab?: { id?: number };
    id?: string;
}

type ChromeSendResponse = (response?: unknown) => void;

interface ChromeRuntimePort {
    name: string;
    postMessage(message: unknown): void;
    onMessage: {
        addListener(callback: (message: unknown, port: ChromeRuntimePort) => void): void;
        removeListener(callback: (message: unknown, port: ChromeRuntimePort) => void): void;
    };
    onDisconnect: {
        addListener(callback: (port: ChromeRuntimePort) => void): void;
        removeListener(callback: (port: ChromeRuntimePort) => void): void;
    };
    disconnect(): void;
}

interface ChromeRuntime {
    sendMessage(message: unknown, callback?: (response: unknown) => void): void;
    sendMessage(message: unknown): Promise<unknown>;
    onMessage: {
        addListener(
            callback: (
                message: unknown,
                sender: ChromeMessageSender,
                sendResponse: ChromeSendResponse,
            ) => boolean | void,
        ): void;
        removeListener(
            callback: (
                message: unknown,
                sender: ChromeMessageSender,
                sendResponse: ChromeSendResponse,
            ) => boolean | void,
        ): void;
    };
    connect(connectInfo?: { name?: string }): ChromeRuntimePort;
}

interface ChromeTabs {
    sendMessage(tabId: number, message: unknown, callback?: (response: unknown) => void): void;
    sendMessage(tabId: number, message: unknown): Promise<unknown>;
}

function getChromeRuntime(): ChromeRuntime | undefined {
    return (globalThis as any).chrome?.runtime as ChromeRuntime | undefined;
}

function getChromeTabs(): ChromeTabs | undefined {
    return (globalThis as any).chrome?.tabs as ChromeTabs | undefined;
}

export interface ChromeRuntimeTransportOptions {
    /**
     * Channel identifier. Both sides must use the same channel.
     * @default 'page-mcp'
     */
    channel?: string;

    /** RPC timeout in milliseconds @default 10000 */
    timeout?: number;

    /**
     * Whether to use long-lived `chrome.runtime.connect` Port instead of
     * one-shot `chrome.runtime.sendMessage`. Ports are more efficient
     * for frequent communication.
     * @default false
     */
    usePort?: boolean;

    /**
     * Port name when using long-lived connections.
     * @default 'page-mcp-port'
     */
    portName?: string;

    /**
     * Tab ID for Background → Content Script communication.
     * When set, messages are sent via `chrome.tabs.sendMessage(tabId, ...)`.
     * When not set, messages are sent via `chrome.runtime.sendMessage(...)`.
     */
    tabId?: number;
}

/**
 * Transport for Chrome Extension messaging via `chrome.runtime`.
 *
 * Supports two modes:
 * 1. **One-shot** (default): Uses `chrome.runtime.sendMessage` / `chrome.runtime.onMessage`
 * 2. **Port** (`usePort: true`): Uses `chrome.runtime.connect` for long-lived connections
 *
 * ```ts
 * // Content Script side
 * const transport = new ChromeRuntimeTransport();
 * const client = new PageMcpClient({ transport });
 * await client.connect();
 *
 * // Background Script side
 * const transport = new ChromeRuntimeTransport({ tabId: activeTabId });
 * // relay messages to/from the content script
 * ```
 */
export class ChromeRuntimeTransport implements ITransport {
    private readonly channel: string;
    private readonly timeout: number;
    private readonly usePort: boolean;
    private readonly portName: string;
    private readonly tabId?: number;

    private listeners = new Map<string, Set<Listener>>();
    private pendingRequests = new Map<string, {
        resolve: (value: RpcResponse) => void;
        reject: (reason: Error) => void;
        timer: ReturnType<typeof setTimeout>;
    }>();
    private requestHandler: RpcHandler | null = null;
    private port: ChromeRuntimePort | null = null;
    private destroyed = false;

    constructor(options?: ChromeRuntimeTransportOptions) {
        this.channel = options?.channel ?? 'page-mcp';
        this.timeout = options?.timeout ?? 10_000;
        this.usePort = options?.usePort ?? false;
        this.portName = options?.portName ?? 'page-mcp-port';
        this.tabId = options?.tabId;

        if (this.usePort) {
            this.initPort();
        } else {
            this.initOneShotListener();
        }
    }

    // ---- Initialization ----

    private initPort(): void {
        const runtime = getChromeRuntime();
        if (!runtime) {
            console.warn('[ChromeRuntimeTransport] chrome.runtime not available');
            return;
        }

        this.port = runtime.connect({ name: this.portName });
        this.port.onMessage.addListener(this.handlePortMessage);
        this.port.onDisconnect.addListener(this.handlePortDisconnect);
    }

    private initOneShotListener(): void {
        const runtime = getChromeRuntime();
        if (!runtime) {
            console.warn('[ChromeRuntimeTransport] chrome.runtime not available');
            return;
        }

        runtime.onMessage.addListener(this.handleOneShotMessage);
    }

    // ---- Message handlers ----

    private handlePortMessage = (message: unknown): void => {
        this.processIncoming(message as ChromeRuntimeMessage);
    };

    private handlePortDisconnect = (): void => {
        this.port = null;
        this.emitLocal('transport:disconnected', undefined);
    };

    private handleOneShotMessage = (
        message: unknown,
        _sender: ChromeMessageSender,
        sendResponse: ChromeSendResponse,
    ): boolean | void => {
        const msg = message as ChromeRuntimeMessage;
        if (!msg || msg.channel !== this.channel) return;

        // For rpc:request when we're acting as Host, we need to send
        // the response back through sendResponse
        if (msg.type === 'rpc:request' && this.requestHandler) {
            const request = msg.payload as RpcRequest;
            this.emitLocal('rpc:request', request);

            this.requestHandler(request)
                .then((response) => {
                    sendResponse({
                        channel: this.channel,
                        type: 'rpc:response',
                        payload: response,
                    } satisfies ChromeRuntimeMessage);
                })
                .catch((err) => {
                    sendResponse({
                        channel: this.channel,
                        type: 'rpc:response',
                        payload: {
                            id: request.id,
                            error: {
                                code: -32603,
                                message: err instanceof Error ? err.message : 'Internal error',
                            },
                        } satisfies RpcResponse,
                    } satisfies ChromeRuntimeMessage);
                });

            // Return true to indicate we will respond asynchronously
            return true;
        }

        this.processIncoming(msg);
    };

    private processIncoming(msg: ChromeRuntimeMessage): void {
        if (this.destroyed) return;
        if (msg.channel !== this.channel) return;

        switch (msg.type) {
            case 'rpc:request': {
                const request = msg.payload as RpcRequest;
                this.emitLocal('rpc:request', request);

                if (this.requestHandler) {
                    this.requestHandler(request)
                        .then((response) => this.sendMessage({
                            channel: this.channel,
                            type: 'rpc:response',
                            payload: response,
                        }))
                        .catch((err) => this.sendMessage({
                            channel: this.channel,
                            type: 'rpc:response',
                            payload: {
                                id: request.id,
                                error: {
                                    code: -32603,
                                    message: err instanceof Error ? err.message : 'Internal error',
                                },
                            } satisfies RpcResponse,
                        }));
                }
                break;
            }

            case 'rpc:response': {
                const response = msg.payload as RpcResponse;
                this.resolveRequest(response);
                break;
            }

            case 'event': {
                if (msg.eventName) {
                    this.emitLocal(msg.eventName, msg.payload);
                }
                break;
            }
        }
    }

    // ---- RPC: Client side ----

    async request(method: RpcMethod, params?: Record<string, unknown>): Promise<RpcResponse> {
        if (this.destroyed) {
            throw new Error('ChromeRuntimeTransport is destroyed');
        }

        const id = generateId();
        const request: RpcRequest = { id, method, params };

        return new Promise<RpcResponse>((resolve, reject) => {
            const timer = setTimeout(() => {
                this.pendingRequests.delete(id);
                reject(new Error(`RPC timeout: ${method} (${id})`));
            }, this.timeout);

            this.pendingRequests.set(id, { resolve, reject, timer });

            const envelope: ChromeRuntimeMessage = {
                channel: this.channel,
                type: 'rpc:request',
                payload: request,
            };

            if (this.usePort) {
                this.sendMessage(envelope);
                this.emitLocal('rpc:request', request);
            } else {
                // One-shot: use sendMessage with callback for response
                this.sendOneShotRequest(envelope, id);
                this.emitLocal('rpc:request', request);
            }
        });
    }

    private sendOneShotRequest(envelope: ChromeRuntimeMessage, requestId: string): void {
        const tabs = getChromeTabs();
        const runtime = getChromeRuntime();

        const handleResponse = (rawResponse: unknown) => {
            const response = rawResponse as ChromeRuntimeMessage | undefined;
            if (response?.type === 'rpc:response' && response.channel === this.channel) {
                this.resolveRequest(response.payload as RpcResponse);
            }
        };

        try {
            if (this.tabId !== undefined && tabs) {
                tabs.sendMessage(this.tabId, envelope, handleResponse);
            } else if (runtime) {
                runtime.sendMessage(envelope, handleResponse);
            } else {
                const pending = this.pendingRequests.get(requestId);
                if (pending) {
                    clearTimeout(pending.timer);
                    this.pendingRequests.delete(requestId);
                    pending.reject(new Error('chrome.runtime not available'));
                }
            }
        } catch (err) {
            const pending = this.pendingRequests.get(requestId);
            if (pending) {
                clearTimeout(pending.timer);
                this.pendingRequests.delete(requestId);
                pending.reject(err instanceof Error ? err : new Error(String(err)));
            }
        }
    }

    // ---- RPC: Host side ----

    onRequest(handler: RpcHandler): void {
        this.requestHandler = handler;
    }

    // ---- Pub/Sub ----

    on(event: string, callback: Listener): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(callback);
    }

    off(event: string, callback: Listener): void {
        this.listeners.get(event)?.delete(callback);
    }

    emit(event: string, data?: unknown): void {
        this.emitLocal(event, data);

        // Also send events across the boundary
        if (!event.startsWith('rpc:') && !event.startsWith('transport:')) {
            this.sendMessage({
                channel: this.channel,
                type: 'event',
                eventName: event,
                payload: data,
            });
        }
    }

    // ---- Internal helpers ----

    private emitLocal(event: string, data?: unknown): void {
        const handlers = this.listeners.get(event);
        if (handlers) {
            for (const handler of handlers) {
                try {
                    handler(data);
                } catch (err) {
                    console.error(`[ChromeRuntimeTransport] Error in listener for "${event}":`, err);
                }
            }
        }
    }

    private resolveRequest(response: RpcResponse): void {
        const pending = this.pendingRequests.get(response.id);
        if (pending) {
            clearTimeout(pending.timer);
            this.pendingRequests.delete(response.id);
            pending.resolve(response);
        }
        this.emitLocal('rpc:response', response);
    }

    private sendMessage(message: ChromeRuntimeMessage): void {
        if (this.destroyed) return;

        try {
            if (this.usePort && this.port) {
                this.port.postMessage(message);
            } else {
                const tabs = getChromeTabs();
                const runtime = getChromeRuntime();

                if (this.tabId !== undefined && tabs) {
                    tabs.sendMessage(this.tabId, message);
                } else if (runtime) {
                    runtime.sendMessage(message);
                }
            }
        } catch (err) {
            console.error('[ChromeRuntimeTransport] Failed to send message:', err);
        }
    }

    // ---- Cleanup ----

    destroy(): void {
        this.destroyed = true;

        const runtime = getChromeRuntime();
        if (!this.usePort && runtime) {
            runtime.onMessage.removeListener(this.handleOneShotMessage);
        }

        if (this.port) {
            this.port.onMessage.removeListener(this.handlePortMessage);
            this.port.onDisconnect.removeListener(this.handlePortDisconnect);
            this.port.disconnect();
            this.port = null;
        }

        for (const [, pending] of this.pendingRequests) {
            clearTimeout(pending.timer);
            pending.reject(new Error('ChromeRuntimeTransport destroyed'));
        }
        this.pendingRequests.clear();
        this.listeners.clear();
        this.requestHandler = null;
    }
}
