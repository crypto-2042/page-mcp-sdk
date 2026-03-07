// ============================================================
// Page MCP SDK — PageMcpClient (AI Side)
// ============================================================

import { EventBus } from './transport.js';
import type {
    ToolInfo,
    ResourceInfo,
    PromptInfo,
    HostInfo,
    ITransport,
    RpcMethod,
    RpcResponse,
} from './types.js';

export interface PageMcpClientOptions {
    /** @deprecated Use `transport` instead. Kept for backward compatibility. */
    bus?: EventBus;
    /** Transport layer for Host ↔ Client communication */
    transport?: ITransport;
    /** Connection timeout in ms (default 5000) */
    connectTimeout?: number;
}

/**
 * AI-side Client that discovers and invokes page capabilities.
 */
export class PageMcpClient {
    private readonly transport: ITransport;
    private readonly connectTimeout: number;
    private hostInfo: HostInfo | null = null;
    private connected = false;

    constructor(options?: PageMcpClientOptions) {
        this.transport = options?.transport ?? options?.bus ?? new EventBus();
        this.connectTimeout = options?.connectTimeout ?? 5_000;
    }

    /**
     * Get the transport instance.
     */
    getTransport(): ITransport {
        return this.transport;
    }

    /** @deprecated Use getTransport() instead */
    getBus(): EventBus {
        if (this.transport instanceof EventBus) {
            return this.transport;
        }
        throw new Error(
            'getBus() is only available when using EventBus transport. ' +
            'Use getTransport() instead for generic transport access.'
        );
    }

    /**
     * Connect to the Host.
     * Prefer MCP initialize handshake and fallback to legacy host info
     * only when initialize is not implemented.
     */
    async connect(): Promise<HostInfo> {
        if (this.connected && this.hostInfo) {
            return this.hostInfo;
        }

        const initializedResponse = await this.requestWithTimeout('initialize', {
            protocolVersion: '2025-11-05',
            capabilities: {},
            clientInfo: { name: 'page-mcp-client', version: '1.0.0' },
        });

        if (!initializedResponse.error) {
            const initialized = initializedResponse.result as {
                protocolVersion: string;
                capabilities: Record<string, unknown>;
                serverInfo: { name: string; version: string };
            };
            this.hostInfo = {
                name: initialized.serverInfo.name,
                version: initialized.serverInfo.version,
                capabilities: initialized.capabilities,
            };
            this.connected = true;
            return this.hostInfo;
        }

        if (!this.isMethodNotFound(initializedResponse.error)) {
            throw new Error(`Connection failed: ${initializedResponse.error.message}`);
        }

        const response = await this.requestWithTimeout('getHostInfo');
        if (response.error) {
            throw new Error(`Connection failed: ${response.error.message}`);
        }
        this.hostInfo = response.result as HostInfo;
        this.connected = true;
        return this.hostInfo;
    }

    async initialize(params?: {
        protocolVersion?: string;
        capabilities?: Record<string, unknown>;
        clientInfo?: { name: string; version: string };
    }): Promise<{
        protocolVersion: string;
        capabilities: Record<string, unknown>;
        serverInfo: { name: string; version: string };
    }> {
        const response = await this.requestWithTimeout('initialize', {
            protocolVersion: params?.protocolVersion ?? '2025-11-05',
            capabilities: params?.capabilities ?? {},
            clientInfo: params?.clientInfo ?? { name: 'page-mcp-client', version: '1.0.0' },
        });
        if (response.error) throw new Error(response.error.message);
        return response.result as {
            protocolVersion: string;
            capabilities: Record<string, unknown>;
            serverInfo: { name: string; version: string };
        };
    }

    /** Check if connected to a Host */
    isConnected(): boolean {
        return this.connected;
    }

    /** Get the connected Host's info */
    getHostInfo(): HostInfo | null {
        return this.hostInfo;
    }

    // ---- MCP: Tools ----

    async toolsList(params?: { cursor?: string; limit?: number }): Promise<{ items: ToolInfo[]; nextCursor?: string }> {
        this.ensureConnected();
        const response = await this.transport.request('tools/list', {
            cursor: params?.cursor ?? '0',
            limit: params?.limit,
        });
        if (response.error) throw new Error(response.error.message);
        const result = response.result as { items?: ToolInfo[]; nextCursor?: string } | ToolInfo[];
        if (Array.isArray(result)) return { items: result };
        return { items: result.items ?? [], nextCursor: result.nextCursor };
    }

    async toolsCall(name: string, args?: Record<string, unknown>): Promise<unknown> {
        this.ensureConnected();
        const response = await this.transport.request('tools/call', { name, arguments: args ?? {} });
        if (response.error) throw new Error(response.error.message);
        return response.result;
    }

    async listTools(): Promise<ToolInfo[]> {
        const result = await this.toolsList({ cursor: '0' });
        return result.items;
    }

    async callTool(name: string, args?: Record<string, unknown>): Promise<unknown> {
        return this.toolsCall(name, args);
    }

    // ---- MCP: Resources ----

    async resourcesList(params?: { cursor?: string; limit?: number }): Promise<{ items: ResourceInfo[]; nextCursor?: string }> {
        this.ensureConnected();
        const response = await this.transport.request('resources/list', {
            cursor: params?.cursor ?? '0',
            limit: params?.limit,
        });
        if (response.error) throw new Error(response.error.message);
        const result = response.result as { items?: ResourceInfo[]; nextCursor?: string } | ResourceInfo[];
        if (Array.isArray(result)) return { items: result };
        return { items: result.items ?? [], nextCursor: result.nextCursor };
    }

    async resourcesRead(uri: string): Promise<unknown> {
        this.ensureConnected();
        const response = await this.transport.request('resources/read', { uri });
        if (response.error) throw new Error(response.error.message);
        return response.result;
    }

    async listResources(): Promise<ResourceInfo[]> {
        const result = await this.resourcesList({ cursor: '0' });
        return result.items;
    }

    async readResource(uri: string): Promise<unknown> {
        return this.resourcesRead(uri);
    }

    // ---- Prompts ----

    async promptsList(params?: { cursor?: string; limit?: number }): Promise<{ items: PromptInfo[]; nextCursor?: string }> {
        this.ensureConnected();
        const response = await this.transport.request('prompts/list', {
            cursor: params?.cursor ?? '0',
            limit: params?.limit,
        });
        if (response.error) throw new Error(response.error.message);
        const result = response.result as { items?: PromptInfo[]; nextCursor?: string } | PromptInfo[];
        if (Array.isArray(result)) return { items: result };
        return { items: result.items ?? [], nextCursor: result.nextCursor };
    }

    async promptsGet(name: string, args?: Record<string, unknown>): Promise<unknown> {
        this.ensureConnected();
        const response = await this.transport.request('prompts/get', { name, arguments: args ?? {} });
        if (response.error) throw new Error(response.error.message);
        return response.result;
    }

    async listPrompts(): Promise<PromptInfo[]> {
        const result = await this.promptsList({ cursor: '0' });
        return result.items;
    }

    async getPrompt(name: string, args?: Record<string, unknown>): Promise<unknown> {
        return this.promptsGet(name, args);
    }

    // ---- Helpers ----

    private async requestWithTimeout(
        method: RpcMethod,
        params?: Record<string, unknown>
    ): Promise<RpcResponse> {
        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
            return await Promise.race([
                this.transport.request(method, params),
                new Promise<never>((_, reject) => {
                    timer = setTimeout(() => {
                        reject(new Error(`Connection timeout after ${this.connectTimeout}ms (${method})`));
                    }, this.connectTimeout);
                }),
            ]);
        } finally {
            if (timer) clearTimeout(timer);
        }
    }

    private isMethodNotFound(error?: { code: number; message: string }): boolean {
        return !!error && error.code === -32601;
    }

    private ensureConnected(): void {
        if (!this.connected) {
            throw new Error('PageMcpClient is not connected. Call connect() first.');
        }
    }

    /** Disconnect and clean up */
    disconnect(): void {
        this.connected = false;
        this.hostInfo = null;
    }
}
