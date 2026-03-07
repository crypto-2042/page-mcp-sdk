// ============================================================
// Page MCP SDK — EventBus Transport
// ============================================================

import type { RpcRequest, RpcResponse, RpcMethod, ITransport } from './types.js';

type Listener = (data: unknown) => void;
type RpcHandler = (request: RpcRequest) => Promise<RpcResponse>;

let idCounter = 0;
function generateId(): string {
    return `rpc_${Date.now()}_${++idCounter}`;
}

/**
 * In-memory EventBus for Host ↔ Client communication.
 * Supports both pub/sub events and request/response RPC.
 *
 * Suitable for same-context usage where Host and Client share
 * the same JavaScript execution environment.
 */
export class EventBus implements ITransport {
    private listeners = new Map<string, Set<Listener>>();
    private pendingRequests = new Map<string, {
        resolve: (value: RpcResponse) => void;
        reject: (reason: Error) => void;
        timer: ReturnType<typeof setTimeout>;
    }>();
    private requestHandler: RpcHandler | null = null;

    /** Timeout for RPC requests in milliseconds */
    private readonly timeout: number;

    constructor(options?: { timeout?: number }) {
        this.timeout = options?.timeout ?? 10_000;
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
        const handlers = this.listeners.get(event);
        if (handlers) {
            for (const handler of handlers) {
                try {
                    handler(data);
                } catch (err) {
                    console.error(`[EventBus] Error in listener for "${event}":`, err);
                }
            }
        }
    }

    // ---- RPC: Client side ----

    /**
     * Send an RPC request and wait for a response.
     */
    async request(method: RpcRequest['method'], params?: Record<string, unknown>): Promise<RpcResponse> {
        const id = generateId();
        const request: RpcRequest = { id, method, params };

        return new Promise<RpcResponse>((resolve, reject) => {
            const timer = setTimeout(() => {
                this.pendingRequests.delete(id);
                reject(new Error(`RPC timeout: ${method} (${id})`));
            }, this.timeout);

            this.pendingRequests.set(id, { resolve, reject, timer });

            // Emit the request for the Host to handle
            this.emit('rpc:request', request);
        });
    }

    // ---- RPC: Host side ----

    /**
     * Register a handler for incoming RPC requests (Host side).
     */
    onRequest(handler: RpcHandler): void {
        this.requestHandler = handler;

        // Listen for incoming requests and route to handler
        this.on('rpc:request', async (data) => {
            const request = data as RpcRequest;
            try {
                const response = await this.requestHandler!(request);
                this.resolveRequest(response);
            } catch (err) {
                const errorResponse: RpcResponse = {
                    id: request.id,
                    error: {
                        code: -32603,
                        message: err instanceof Error ? err.message : 'Internal error',
                    },
                };
                this.resolveRequest(errorResponse);
            }
        });
    }

    // ---- RPC: Response resolution ----

    private resolveRequest(response: RpcResponse): void {
        const pending = this.pendingRequests.get(response.id);
        if (pending) {
            clearTimeout(pending.timer);
            this.pendingRequests.delete(response.id);
            pending.resolve(response);
        }
        // Also emit for logging/debugging
        this.emit('rpc:response', response);
    }

    // ---- Cleanup ----

    destroy(): void {
        for (const [, pending] of this.pendingRequests) {
            clearTimeout(pending.timer);
            pending.reject(new Error('EventBus destroyed'));
        }
        this.pendingRequests.clear();
        this.listeners.clear();
        this.requestHandler = null;
    }
}
