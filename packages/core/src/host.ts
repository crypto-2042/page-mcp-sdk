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
    HostInfo,
    RpcRequest,
    RpcResponse,
} from './types.js';

export interface PageMcpHostOptions {
    name: string;
    version: string;
    bus?: EventBus;
}

/**
 * Page-side Host that registers Tools, Resources, and Skills
 * and handles incoming RPC requests from the AI Client.
 */
export class PageMcpHost {
    private readonly info: HostInfo;
    private readonly bus: EventBus;
    private readonly tools = new Map<string, ToolDefinition>();
    private readonly resources = new Map<string, ResourceDefinition>();
    private readonly skills = new Map<string, SkillDefinition>();
    private readonly skillRunner = new SkillRunner();

    constructor(options: PageMcpHostOptions) {
        this.info = { name: options.name, version: options.version };
        this.bus = options.bus ?? new EventBus();
    }

    /** Get the shared EventBus (pass to PageMcpClient for same-context usage) */
    getBus(): EventBus {
        return this.bus;
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

    // ---- Start listening ----

    start(): void {
        this.bus.onRequest(async (request: RpcRequest): Promise<RpcResponse> => {
            return this.handleRequest(request);
        });

        // Broadcast readiness
        this.bus.emit('host:ready', this.info);
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
        this.bus.destroy();
    }
}
