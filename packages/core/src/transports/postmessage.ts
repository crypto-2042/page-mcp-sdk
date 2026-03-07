// ============================================================
// Page MCP SDK — PostMessage Transport
// Cross-context communication via window.postMessage
// Used for: Content Script ↔ Page Context
// ============================================================

import type { RpcRequest, RpcResponse, RpcMethod, ITransport } from '../types.js';

type Listener = (data: unknown) => void;
type RpcHandler = (request: RpcRequest) => Promise<RpcResponse>;

let idCounter = 0;
function generateId(): string {
    return `pm_${Date.now()}_${++idCounter}`;
}

/** Message envelope sent over postMessage */
interface PostMessageEnvelope {
    /** Channel identifier to filter unrelated messages */
    channel: string;
    /** Message type */
    type: 'rpc:request' | 'rpc:response' | 'event';
    /** Payload data */
    payload: unknown;
    /** Event name (only for type === 'event') */
    eventName?: string;
}

export interface PostMessageTransportOptions {
    /**
     * Channel identifier string. Both sides must use the same channel.
     * @default 'page-mcp'
     */
    channel?: string;

    /**
     * Target origin for postMessage. Use '*' for development,
     * restrict to specific origin in production.
     * @default '*'
     */
    targetOrigin?: string;

    /** RPC timeout in milliseconds @default 10000 */
    timeout?: number;

    /**
     * The window to post messages to and listen on.
     * @default globalThis.window
     */
    targetWindow?: Window;

    /**
     * Set to 'host' or 'client' to clarify the role of this transport.
     * When 'host', incoming rpc:request messages are handled.
     * When 'client', incoming rpc:response messages are handled.
     * When undefined, both directions are handled (useful for debugging).
     * @default undefined
     */
    role?: 'host' | 'client';
}

/**
 * Transport for cross-context communication via `window.postMessage`.
 *
 * Typical use case: a browser extension's Content Script communicating
 * with a page's PageMcpHost across the JS isolation boundary.
 *
 * ```ts
 * // Page side (Host)
 * const transport = new PostMessageTransport({ role: 'host' });
 * const host = new PageMcpHost({ name: 'app', version: '1.0', transport });
 * host.start();
 *
 * // Content Script side (Client)
 * const transport = new PostMessageTransport({ role: 'client' });
 * const client = new PageMcpClient({ transport });
 * await client.connect();
 * ```
 */
export class PostMessageTransport implements ITransport {
    private readonly channel: string;
    private readonly targetOrigin: string;
    private readonly timeout: number;
    private readonly targetWindow: Window;
    private readonly role?: 'host' | 'client';

    private listeners = new Map<string, Set<Listener>>();
    private pendingRequests = new Map<string, {
        resolve: (value: RpcResponse) => void;
        reject: (reason: Error) => void;
        timer: ReturnType<typeof setTimeout>;
    }>();
    private requestHandler: RpcHandler | null = null;
    private destroyed = false;

    constructor(options?: PostMessageTransportOptions) {
        this.channel = options?.channel ?? 'page-mcp';
        this.targetOrigin = options?.targetOrigin ?? '*';
        this.timeout = options?.timeout ?? 10_000;
        this.targetWindow = options?.targetWindow ?? globalThis.window;
        this.role = options?.role;

        // Start listening for incoming messages
        this.targetWindow.addEventListener('message', this.handleMessage);
    }

    // ---- Incoming message handler ----

    private handleMessage = (event: MessageEvent): void => {
        if (this.destroyed) return;

        const envelope = event.data as PostMessageEnvelope;

        // Filter out messages from other channels
        if (!envelope || envelope.channel !== this.channel) return;

        switch (envelope.type) {
            case 'rpc:request': {
                // Host side: received a request from Client
                if (this.role === 'client') break;
                const request = envelope.payload as RpcRequest;
                this.emit('rpc:request', request);

                if (this.requestHandler) {
                    this.requestHandler(request)
                        .then((response) => {
                            this.postEnvelope({
                                channel: this.channel,
                                type: 'rpc:response',
                                payload: response,
                            });
                        })
                        .catch((err) => {
                            const errorResponse: RpcResponse = {
                                id: request.id,
                                error: {
                                    code: -32603,
                                    message: err instanceof Error ? err.message : 'Internal error',
                                },
                            };
                            this.postEnvelope({
                                channel: this.channel,
                                type: 'rpc:response',
                                payload: errorResponse,
                            });
                        });
                }
                break;
            }

            case 'rpc:response': {
                // Client side: received a response from Host
                if (this.role === 'host') break;
                const response = envelope.payload as RpcResponse;
                this.resolveRequest(response);
                break;
            }

            case 'event': {
                // Emit to local listeners
                if (envelope.eventName) {
                    this.emitLocal(envelope.eventName, envelope.payload);
                }
                break;
            }
        }
    };

    // ---- RPC: Client side ----

    async request(method: RpcMethod, params?: Record<string, unknown>): Promise<RpcResponse> {
        if (this.destroyed) {
            throw new Error('PostMessageTransport is destroyed');
        }

        const id = generateId();
        const request: RpcRequest = { id, method, params };

        return new Promise<RpcResponse>((resolve, reject) => {
            const timer = setTimeout(() => {
                this.pendingRequests.delete(id);
                reject(new Error(`RPC timeout: ${method} (${id})`));
            }, this.timeout);

            this.pendingRequests.set(id, { resolve, reject, timer });

            // Post the request to the other context
            this.postEnvelope({
                channel: this.channel,
                type: 'rpc:request',
                payload: request,
            });

            // Also emit locally for logging
            this.emitLocal('rpc:request', request);
        });
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

    /**
     * Emit an event. This sends the event both locally and across
     * the postMessage boundary.
     */
    emit(event: string, data?: unknown): void {
        // Emit locally
        this.emitLocal(event, data);

        // Also send across the boundary (for non-rpc events)
        if (!event.startsWith('rpc:')) {
            this.postEnvelope({
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
                    console.error(`[PostMessageTransport] Error in listener for "${event}":`, err);
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

    private postEnvelope(envelope: PostMessageEnvelope): void {
        if (this.destroyed) return;
        try {
            this.targetWindow.postMessage(envelope, this.targetOrigin);
        } catch (err) {
            console.error('[PostMessageTransport] Failed to postMessage:', err);
        }
    }

    // ---- Cleanup ----

    destroy(): void {
        this.destroyed = true;
        this.targetWindow.removeEventListener('message', this.handleMessage);

        for (const [, pending] of this.pendingRequests) {
            clearTimeout(pending.timer);
            pending.reject(new Error('PostMessageTransport destroyed'));
        }
        this.pendingRequests.clear();
        this.listeners.clear();
        this.requestHandler = null;
    }
}
