// ============================================================
// Page MCP SDK — PageMcpHost (Page Side)
// ============================================================

import { EventBus } from './transport.js';
import { SkillRunner } from './skill-runner.js';
import type {
    ToolDefinition,
    ToolInfo,
    ResourceDefinition,
    ResourceInfo,
    SkillDefinition,
    SkillInfo,
    PromptDefinition,
    PromptInfo,
    HostInfo,
    RpcRequest,
    RpcResponse,
    ITransport,
} from './types.js';

export interface PageMcpHostOptions {
    name: string;
    version: string;
    /** @deprecated Use `transport` instead. Kept for backward compatibility. */
    bus?: EventBus;
    /** Transport layer for Host ↔ Client communication */
    transport?: ITransport;
}

/**
 * Page-side Host that registers Tools, Resources, and Skills
 * and handles incoming RPC requests from the AI Client.
 */
export class PageMcpHost {
    private readonly info: HostInfo;
    private readonly transport: ITransport;
    private readonly tools = new Map<string, ToolDefinition>();
    private readonly resources = new Map<string, ResourceDefinition>();
    private readonly skills = new Map<string, SkillDefinition>();
    private readonly prompts = new Map<string, PromptDefinition>();
    private readonly skillRunner = new SkillRunner();

    constructor(options: PageMcpHostOptions) {
        this.info = { name: options.name, version: options.version };
        this.transport = options.transport ?? options.bus ?? new EventBus();
    }

    /**
     * Get the transport instance.
     * If the transport is an EventBus, you can pass it directly to PageMcpClient
     * for same-context usage.
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

    // ---- Registration ----

    registerTool(def: ToolDefinition): this {
        if (this.tools.has(def.name)) {
            throw new Error(`Tool "${def.name}" is already registered`);
        }
        this.tools.set(def.name, def);
        return this;
    }

    registerResource(def: ResourceDefinition): this {
        if (this.resources.has(def.uri)) {
            throw new Error(`Resource "${def.uri}" is already registered`);
        }
        this.resources.set(def.uri, def);
        return this;
    }

    registerSkill(def: SkillDefinition): this {
        if (this.skills.has(def.name)) {
            throw new Error(`Skill "${def.name}" is already registered`);
        }
        // Validate that all referenced tools exist or will exist
        this.skills.set(def.name, def);
        return this;
    }

    registerPrompt(def: PromptDefinition): this {
        if (this.prompts.has(def.name)) {
            throw new Error(`Prompt "${def.name}" is already registered`);
        }
        this.prompts.set(def.name, def);
        return this;
    }

    // ---- Start listening ----

    start(): void {
        this.transport.onRequest(async (request: RpcRequest): Promise<RpcResponse> => {
            return this.handleRequest(request);
        });

        // Broadcast readiness
        this.transport.emit('host:ready', this.info);

        // Expose host globally for browser extension bridge discovery
        if (typeof window !== 'undefined') {
            const w = window as unknown as Record<string, unknown>;
            if (!Array.isArray(w.__pageMcpHosts)) {
                w.__pageMcpHosts = [];
            }
            (w.__pageMcpHosts as PageMcpHost[]).push(this);

            window.dispatchEvent(new CustomEvent('page-mcp:host-ready', {
                detail: { hostInfo: this.info, transport: this.transport },
            }));
        }
    }

    // ---- RPC Handler ----

    private async handleRequest(req: RpcRequest): Promise<RpcResponse> {
        try {
            switch (req.method) {
                case 'ping':
                    return { id: req.id, result: { pong: true } };

                case 'getHostInfo':
                    return { id: req.id, result: this.info };

                case 'listTools':
                    return { id: req.id, result: this.getToolInfoList() };

                case 'callTool': {
                    const { name, args } = (req.params ?? {}) as { name: string; args?: Record<string, unknown> };
                    const result = await this.executeTool(name, args ?? {});
                    return { id: req.id, result };
                }

                case 'listResources':
                    return { id: req.id, result: this.getResourceInfoList() };

                case 'readResource': {
                    const { uri } = (req.params ?? {}) as { uri: string };
                    const result = await this.executeResource(uri);
                    return { id: req.id, result };
                }

                case 'listSkills':
                    return { id: req.id, result: this.getSkillInfoList() };

                case 'executeSkill': {
                    const { name, args } = (req.params ?? {}) as { name: string; args?: Record<string, unknown> };
                    const result = await this.executeSkillByName(name, args ?? {});
                    return { id: req.id, result };
                }

                case 'listPrompts':
                    return { id: req.id, result: this.getPromptInfoList() };

                default:
                    return {
                        id: req.id,
                        error: { code: -32601, message: `Unknown method: ${req.method}` },
                    };
            }
        } catch (err) {
            return {
                id: req.id,
                error: {
                    code: -32603,
                    message: err instanceof Error ? err.message : 'Internal error',
                },
            };
        }
    }

    // ---- Internal helpers ----

    private getToolInfoList(): ToolInfo[] {
        return Array.from(this.tools.values()).map(({ name, description, inputSchema, annotations }) => ({
            name,
            description,
            inputSchema,
            annotations,
        }));
    }

    private getResourceInfoList(): ResourceInfo[] {
        return Array.from(this.resources.values()).map(({ uri, name, description }) => ({
            uri,
            name,
            description,
        }));
    }

    private getSkillInfoList(): SkillInfo[] {
        return Array.from(this.skills.values()).map(({ name, description, inputSchema, steps }) => ({
            name,
            description,
            inputSchema,
            steps: steps.map((s) => s.name),
        }));
    }

    private getPromptInfoList(): PromptInfo[] {
        return Array.from(this.prompts.values()).map(({ name, title, description, icon, prompt }) => ({
            name,
            title,
            description,
            icon,
            prompt,
        }));
    }

    private async executeTool(name: string, args: Record<string, unknown>): Promise<unknown> {
        const tool = this.tools.get(name);
        if (!tool) {
            throw new Error(`Tool not found: ${name}`);
        }
        return tool.execute(args);
    }

    private async executeResource(uri: string): Promise<unknown> {
        const resource = this.resources.get(uri);
        if (!resource) {
            throw new Error(`Resource not found: ${uri}`);
        }
        return resource.handler();
    }

    private async executeSkillByName(name: string, args: Record<string, unknown>): Promise<unknown> {
        const skill = this.skills.get(name);
        if (!skill) {
            throw new Error(`Skill not found: ${name}`);
        }

        // Verify all referenced tools exist
        for (const step of skill.steps) {
            if (!this.tools.has(step.tool)) {
                throw new Error(`Skill "${name}" references unknown tool "${step.tool}" in step "${step.name}"`);
            }
        }

        return this.skillRunner.run(skill, args, (toolName, toolArgs) => this.executeTool(toolName, toolArgs));
    }

    /** Stop listening and clean up */
    destroy(): void {
        // Remove from global registry
        if (typeof window !== 'undefined') {
            const w = window as unknown as Record<string, unknown>;
            const hosts = w.__pageMcpHosts as PageMcpHost[] | undefined;
            if (Array.isArray(hosts)) {
                const idx = hosts.indexOf(this);
                if (idx >= 0) hosts.splice(idx, 1);
            }
        }
        this.transport.destroy();
    }
}
