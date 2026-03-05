// ============================================================
// Page MCP SDK — PageMcpClient (AI Side)
// ============================================================

import { EventBus } from './transport.js';
import type {
    ToolInfo,
    ResourceInfo,
    SkillInfo,
    SkillResult,
    PromptInfo,
    HostInfo,
} from './types.js';

export interface PageMcpClientOptions {
    bus?: EventBus;
    /** Connection timeout in ms (default 5000) */
    connectTimeout?: number;
}

/**
 * AI-side Client that discovers and invokes page capabilities.
 */
export class PageMcpClient {
    private readonly bus: EventBus;
    private readonly connectTimeout: number;
    private hostInfo: HostInfo | null = null;
    private connected = false;

    constructor(options?: PageMcpClientOptions) {
        this.bus = options?.bus ?? new EventBus();
        this.connectTimeout = options?.connectTimeout ?? 5_000;
    }

    /** Get the shared EventBus */
    getBus(): EventBus {
        return this.bus;
    }

    /**
     * Connect to the Host. Resolves when the Host responds to ping.
     */
    async connect(): Promise<HostInfo> {
        if (this.connected && this.hostInfo) {
            return this.hostInfo;
        }

        // Try to ping the host
        const response = await this.bus.request('getHostInfo');
        if (response.error) {
            throw new Error(`Connection failed: ${response.error.message}`);
        }

        this.hostInfo = response.result as HostInfo;
        this.connected = true;
        return this.hostInfo;
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

    async listTools(): Promise<ToolInfo[]> {
        this.ensureConnected();
        const response = await this.bus.request('listTools');
        if (response.error) throw new Error(response.error.message);
        return response.result as ToolInfo[];
    }

    async callTool(name: string, args?: Record<string, unknown>): Promise<unknown> {
        this.ensureConnected();
        const response = await this.bus.request('callTool', { name, args: args ?? {} });
        if (response.error) throw new Error(response.error.message);
        return response.result;
    }

    // ---- MCP: Resources ----

    async listResources(): Promise<ResourceInfo[]> {
        this.ensureConnected();
        const response = await this.bus.request('listResources');
        if (response.error) throw new Error(response.error.message);
        return response.result as ResourceInfo[];
    }

    async readResource(uri: string): Promise<unknown> {
        this.ensureConnected();
        const response = await this.bus.request('readResource', { uri });
        if (response.error) throw new Error(response.error.message);
        return response.result;
    }

    // ---- Skills ----

    async listSkills(): Promise<SkillInfo[]> {
        this.ensureConnected();
        const response = await this.bus.request('listSkills');
        if (response.error) throw new Error(response.error.message);
        return response.result as SkillInfo[];
    }

    async executeSkill(name: string, args?: Record<string, unknown>): Promise<SkillResult> {
        this.ensureConnected();
        const response = await this.bus.request('executeSkill', { name, args: args ?? {} });
        if (response.error) throw new Error(response.error.message);
        return response.result as SkillResult;
    }

    // ---- Prompts ----

    async listPrompts(): Promise<PromptInfo[]> {
        this.ensureConnected();
        const response = await this.bus.request('listPrompts');
        if (response.error) throw new Error(response.error.message);
        return response.result as PromptInfo[];
    }

    // ---- Helpers ----

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
