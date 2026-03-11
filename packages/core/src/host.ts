// ============================================================
// Page MCP SDK — PageMcpHost (Page Side)
// ============================================================

import { EventBus } from './transport.js';
import type {
    SkillDefinition,
    SkillInfo,
    SkillGetResult,
    SkillExecutionContext,
    SkillExecutionResult,
    HostInfo,
    RpcRequest,
    RpcResponse,
    ITransport,
} from './types.js';
import type {
    AnthropicMcpPrompt,
    AnthropicMcpResource,
    AnthropicMcpResourceContent,
    AnthropicMcpResourceReadResult,
    AnthropicMcpTool,
    PageMcpPromptDefinition,
    PageMcpResourceDefinition,
    PageMcpToolDefinition,
} from '@page-mcp/protocol';

export interface PageMcpHostOptions {
    name: string;
    version: string;
    /** If true, reject legacy non-standard RPC methods. */
    strictProtocol?: boolean;
    /** @deprecated Use `transport` instead. Kept for backward compatibility. */
    bus?: EventBus;
    /** Transport layer for Host ↔ Client communication */
    transport?: ITransport;
    skills?: {
        /** Allow executing inline JavaScript skill scripts (`scriptJs`). Disabled by default. */
        allowInlineScriptExecution?: boolean;
        requestUserInteraction?: (request: unknown) => Promise<unknown>;
    };
}

/**
 * Page-side Host that registers Tools, Resources, and Prompts
 * and handles incoming RPC requests from the AI Client.
 */
export class PageMcpHost {
    private readonly info: HostInfo;
    private readonly transport: ITransport;
    private readonly tools = new Map<string, PageMcpToolDefinition>();
    private readonly resources = new Map<string, PageMcpResourceDefinition>();
    private readonly skills = new Map<string, SkillDefinition>();
    private readonly prompts = new Map<string, PageMcpPromptDefinition>();
    private readonly strictProtocol: boolean;
    private readonly allowInlineScriptExecution: boolean;
    private readonly requestUserInteraction?: (request: unknown) => Promise<unknown>;

    constructor(options: PageMcpHostOptions) {
        this.info = {
            name: options.name,
            version: options.version,
            capabilities: {
                tools: { listChanged: true },
                resources: { listChanged: true },
                prompts: { listChanged: true },
                extensions: {
                    skills: {
                        version: '1.0.0',
                        execute: true,
                        scriptExecution: options.skills?.allowInlineScriptExecution ? 'inline-js' : 'disabled',
                    },
                },
            },
        };
        this.transport = options.transport ?? options.bus ?? new EventBus();
        this.strictProtocol = options.strictProtocol ?? false;
        this.allowInlineScriptExecution = options.skills?.allowInlineScriptExecution ?? false;
        this.requestUserInteraction = options.skills?.requestUserInteraction;
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

    registerTool(def: PageMcpToolDefinition): this {
        if (this.tools.has(def.name)) {
            throw new Error(`Tool "${def.name}" is already registered`);
        }
        this.tools.set(def.name, def);
        this.transport.emit('notifications/tools/list_changed', {});
        return this;
    }

    unregisterTool(name: string): this {
        if (!this.tools.has(name)) {
            throw new Error(`Tool "${name}" is not registered`);
        }
        this.tools.delete(name);
        this.transport.emit('notifications/tools/list_changed', {});
        return this;
    }

    registerResource(def: PageMcpResourceDefinition): this {
        if (this.resources.has(def.uri)) {
            throw new Error(`Resource "${def.uri}" is already registered`);
        }
        this.resources.set(def.uri, def);
        this.transport.emit('notifications/resources/list_changed', {});
        return this;
    }

    unregisterResource(uri: string): this {
        if (!this.resources.has(uri)) {
            throw new Error(`Resource "${uri}" is not registered`);
        }
        this.resources.delete(uri);
        this.transport.emit('notifications/resources/list_changed', {});
        return this;
    }

    registerSkill(def: SkillDefinition): this {
        if (this.skills.has(def.name)) {
            throw new Error(`Skill "${def.name}" is already registered`);
        }
        if (!def.name || !def.version || !def.skillMd) {
            throw new Error('Skill name, version and skillMd are required');
        }
        this.skills.set(def.name, def);
        return this;
    }

    unregisterSkill(name: string): this {
        if (!this.skills.has(name)) {
            throw new Error(`Skill "${name}" is not registered`);
        }
        this.skills.delete(name);
        return this;
    }

    registerPrompt(def: PageMcpPromptDefinition): this {
        if (this.prompts.has(def.name)) {
            throw new Error(`Prompt "${def.name}" is already registered`);
        }
        if (!def.messages && !def.handler) {
            throw new Error(`Prompt "${def.name}" must define either messages or handler`);
        }
        this.prompts.set(def.name, def);
        this.transport.emit('notifications/prompts/list_changed', {});
        return this;
    }

    unregisterPrompt(name: string): this {
        if (!this.prompts.has(name)) {
            throw new Error(`Prompt "${name}" is not registered`);
        }
        this.prompts.delete(name);
        this.transport.emit('notifications/prompts/list_changed', {});
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
            if (this.strictProtocol && this.isLegacyMethod(req.method)) {
                return {
                    id: req.id,
                    error: { code: -32601, message: `Unknown method: ${req.method}` },
                };
            }

            switch (req.method) {
                case 'initialize': {
                    const protocolVersion =
                        typeof req.params?.protocolVersion === 'string'
                            ? req.params.protocolVersion
                            : '2025-11-05';
                    return {
                        id: req.id,
                        result: {
                            protocolVersion,
                            capabilities: this.info.capabilities ?? {},
                            serverInfo: { name: this.info.name, version: this.info.version },
                        },
                    };
                }
                case 'ping':
                    return { id: req.id, result: { pong: true } };

                case 'getHostInfo':
                    return { id: req.id, result: this.info };

                case 'listTools':
                    return { id: req.id, result: this.getToolInfoList() };
                case 'tools/list': {
                    const { cursor, limit } = (req.params ?? {}) as { cursor?: string; limit?: number };
                    return { id: req.id, result: this.paginate(this.getToolInfoList(), cursor, limit) };
                }

                case 'callTool': {
                    const { name, args, arguments: toolArguments } = (req.params ?? {}) as {
                        name: string;
                        args?: Record<string, unknown>;
                        arguments?: Record<string, unknown>;
                    };
                    const result = await this.executeTool(name, toolArguments ?? args ?? {});
                    return { id: req.id, result };
                }
                case 'tools/call': {
                    const { name, args, arguments: toolArguments } = (req.params ?? {}) as {
                        name: string;
                        args?: Record<string, unknown>;
                        arguments?: Record<string, unknown>;
                    };
                    const result = await this.executeTool(name, toolArguments ?? args ?? {});
                    return { id: req.id, result };
                }

                case 'listResources':
                case 'resources/list':
                    if (req.method === 'resources/list') {
                        const { cursor, limit } = (req.params ?? {}) as { cursor?: string; limit?: number };
                        return { id: req.id, result: this.paginate(this.getResourceInfoList(), cursor, limit) };
                    }
                    return { id: req.id, result: this.getResourceInfoList() };

                case 'readResource': {
                    const { uri } = (req.params ?? {}) as { uri: string };
                    const result = await this.executeResource(uri);
                    return { id: req.id, result };
                }
                case 'resources/read': {
                    const { uri } = (req.params ?? {}) as { uri: string };
                    const result = await this.executeResource(uri);
                    return { id: req.id, result };
                }

                case 'listPrompts':
                case 'prompts/list':
                    if (req.method === 'prompts/list') {
                        const { cursor, limit } = (req.params ?? {}) as { cursor?: string; limit?: number };
                        return { id: req.id, result: this.paginate(this.getPromptInfoList(), cursor, limit) };
                    }
                    return { id: req.id, result: this.getPromptInfoList() };

                case 'prompts/get': {
                    const { name, args, arguments: promptArgs } = (req.params ?? {}) as {
                        name: string;
                        args?: Record<string, unknown>;
                        arguments?: Record<string, unknown>;
                    };
                    const result = await this.executePromptByName(name, promptArgs ?? args ?? {});
                    return { id: req.id, result };
                }
                case 'extensions/skills/list': {
                    const { cursor, limit } = (req.params ?? {}) as { cursor?: string; limit?: number };
                    return { id: req.id, result: this.paginate(this.getSkillInfoList(), cursor, limit) };
                }
                case 'extensions/skills/get': {
                    const { name } = (req.params ?? {}) as { name: string };
                    return { id: req.id, result: this.getSkillByName(name) };
                }
                case 'extensions/skills/execute': {
                    const { name, args, arguments: skillArguments } = (req.params ?? {}) as {
                        name: string;
                        args?: Record<string, unknown>;
                        arguments?: Record<string, unknown>;
                    };
                    const result = await this.executeSkillByName(name, skillArguments ?? args ?? {});
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

    private getToolInfoList(): AnthropicMcpTool[] {
        return Array.from(this.tools.values()).map(({
            name,
            title,
            description,
            inputSchema,
            outputSchema,
            annotations,
        }) => ({
            name,
            title,
            description,
            inputSchema,
            outputSchema,
            annotations,
        }));
    }

    private getResourceInfoList(): AnthropicMcpResource[] {
        return Array.from(this.resources.values()).map(({ uri, name, description, mimeType }) => ({
            uri,
            name,
            description,
            mimeType,
        }));
    }

    private getPromptInfoList(): AnthropicMcpPrompt[] {
        return Array.from(this.prompts.values()).map(({ name, description, arguments: promptArguments }) => ({
            name,
            description,
            arguments: promptArguments,
        }));
    }

    private getSkillInfoList(): SkillInfo[] {
        return Array.from(this.skills.values()).map(({
            name,
            version,
            description,
            scriptJs,
            inputSchema,
            outputSchema,
            annotations,
        }) => ({
            name,
            version,
            description,
            hasScript: typeof scriptJs === 'string' && scriptJs.length > 0,
            inputSchema,
            outputSchema,
            annotations,
        }));
    }

    private getSkillByName(name: string): SkillGetResult {
        const skill = this.skills.get(name);
        if (!skill) {
            throw new Error(`Skill not found: ${name}`);
        }
        return {
            name: skill.name,
            version: skill.version,
            description: skill.description,
            skillMd: skill.skillMd,
            hasScript: typeof skill.scriptJs === 'string' && skill.scriptJs.length > 0,
            inputSchema: skill.inputSchema,
            outputSchema: skill.outputSchema,
            annotations: skill.annotations,
        };
    }

    private async executeTool(name: string, args: Record<string, unknown>): Promise<unknown> {
        const tool = this.tools.get(name);
        if (!tool) {
            throw new Error(`Tool not found: ${name}`);
        }
        const content = await tool.execute(args);
        return { content };
    }

    private async executeResource(uri: string): Promise<unknown> {
        const resource = this.resources.get(uri);
        if (!resource) {
            throw new Error(`Resource not found: ${uri}`);
        }
        return this.resolveResource(resource);
    }

    private async executePromptByName(name: string, args: Record<string, unknown>): Promise<unknown> {
        const prompt = this.prompts.get(name);
        if (!prompt) {
            throw new Error(`Prompt not found: ${name}`);
        }
        if (prompt.messages) {
            return {
                messages: prompt.messages.map((message) => ({
                    ...message,
                    content: {
                        ...message.content,
                        text: this.renderPromptTemplate(message.content.text, args),
                    },
                })),
            };
        }
        if (prompt.handler) {
            return prompt.handler(args);
        }
        throw new Error(`Prompt "${name}" has no executable template or handler`);
    }

    private renderPromptTemplate(template: string, args: Record<string, unknown>): string {
        return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => {
            const value = args[key];
            return value == null ? '' : String(value);
        });
    }

    private resolveResource(resource: PageMcpResourceDefinition): AnthropicMcpResourceReadResult {
        const mimeType = resource.mimeType ?? 'application/json';
        const nodes = this.queryResourceNodes(resource.uri);

        return {
            contents: [
                {
                    uri: resource.uri,
                    mimeType,
                    text: this.serializeResourceContent(resource.uri, mimeType, nodes),
                },
            ],
        };
    }

    private queryResourceNodes(uri: string): Array<{ textContent?: string | null; outerHTML?: string; children?: ArrayLike<unknown> }> {
        const documentRef = globalThis.document as
            | {
                querySelectorAll?: (selector: string) => ArrayLike<{ textContent?: string | null; outerHTML?: string; children?: ArrayLike<unknown> }>;
                evaluate?: (
                    xpath: string,
                    contextNode: unknown,
                    namespaceResolver: unknown,
                    resultType: number,
                    result: unknown,
                ) => { snapshotLength: number; snapshotItem(index: number): { textContent?: string | null; outerHTML?: string; children?: ArrayLike<unknown> } | null };
              }
            | undefined;
        if (!documentRef) {
            throw new Error('document is not available for resource resolution');
        }

        const parsed = this.parseResourceUri(uri);
        if (parsed.engine === 'selector') {
            if (typeof documentRef.querySelectorAll !== 'function') {
                throw new Error('document.querySelectorAll is not available for selector resources');
            }
            return Array.from(documentRef.querySelectorAll(parsed.expression));
        }

        if (typeof documentRef.evaluate !== 'function' || typeof globalThis.XPathResult === 'undefined') {
            throw new Error('XPath evaluation is not available for xpath resources');
        }
        const snapshot = documentRef.evaluate(
            parsed.expression,
            documentRef,
            null,
            globalThis.XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
            null,
        );
        const nodes: Array<{ textContent?: string | null; outerHTML?: string; children?: ArrayLike<unknown> }> = [];
        for (let index = 0; index < snapshot.snapshotLength; index += 1) {
            const node = snapshot.snapshotItem(index);
            if (node) {
                nodes.push(node);
            }
        }
        return nodes;
    }

    private parseResourceUri(uri: string): { engine: 'selector' | 'xpath'; expression: string } {
        if (uri.startsWith('page://selector/')) {
            return {
                engine: 'selector',
                expression: decodeURIComponent(uri.slice('page://selector/'.length)),
            };
        }
        if (uri.startsWith('page://xpath/')) {
            return {
                engine: 'xpath',
                expression: decodeURIComponent(uri.slice('page://xpath/'.length)),
            };
        }
        throw new Error(`Unsupported resource uri: ${uri}`);
    }

    private serializeResourceContent(
        uri: string,
        mimeType: AnthropicMcpResourceContent['mimeType'],
        nodes: Array<{ textContent?: string | null; outerHTML?: string; children?: ArrayLike<unknown> }>,
    ): string {
        void uri;
        if (mimeType === 'text/html') {
            return nodes[0]?.outerHTML ?? '';
        }
        if (mimeType === 'text/plain') {
            return nodes[0]?.textContent ?? '';
        }
        return JSON.stringify({ content: this.serializeResourceJsonContent(nodes) });
    }

    private serializeResourceJsonContent(
        nodes: Array<{ textContent?: string | null; children?: ArrayLike<unknown> }>,
    ): string[] | string[][] {
        const nodeContents = nodes.map((node) => {
            const children = Array.from(node.children ?? []) as Array<{ textContent?: string | null }>;
            if (children.length === 0) {
                return (node.textContent ?? '').trim();
            }
            return children.map((child) => (child.textContent ?? '').trim());
        });

        if (nodeContents.every((item) => typeof item === 'string')) {
            return nodeContents as string[];
        }
        return nodeContents.map((item) => (Array.isArray(item) ? item : [item]));
    }

    private async executeSkillByName(name: string, args: Record<string, unknown>): Promise<SkillExecutionResult> {
        const skill = this.skills.get(name);
        if (!skill) {
            throw new Error(`Skill not found: ${name}`);
        }

        const context: SkillExecutionContext = {
            callTool: (toolName, toolArgs) => this.executeTool(toolName, toolArgs ?? {}),
            readResource: (uri) => this.executeResource(uri),
            getPrompt: (promptName, promptArgs) => this.executePromptByName(promptName, promptArgs ?? {}),
            requestUserInteraction: this.requestUserInteraction,
        };

        try {
            const output = skill.run
                ? await skill.run(context, args)
                : await this.executeInlineSkillScript(skill, context, args);

            return {
                name: skill.name,
                success: true,
                output,
            };
        } catch (error) {
            return {
                name: skill.name,
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    private async executeInlineSkillScript(
        skill: SkillDefinition,
        context: SkillExecutionContext,
        input: Record<string, unknown>,
    ): Promise<unknown> {
        if (!skill.scriptJs) {
            throw new Error(`Skill "${skill.name}" has no executable handler`);
        }
        if (!this.allowInlineScriptExecution) {
            throw new Error('Inline JavaScript skill execution is disabled');
        }

        const factory = new Function(`"use strict"; return (${skill.scriptJs});`);
        const scriptFn = factory();
        if (typeof scriptFn !== 'function') {
            throw new Error(`Skill "${skill.name}" scriptJs must evaluate to a function`);
        }
        return scriptFn(context, input);
    }

    private paginate<T>(items: T[], cursor?: string, limit?: number): { items: T[]; nextCursor?: string } {
        const start = Number(cursor ?? '0');
        const safeStart = Number.isFinite(start) && start >= 0 ? start : 0;
        const pageSize = typeof limit === 'number' && limit > 0 ? Math.floor(limit) : items.length;
        const slice = items.slice(safeStart, safeStart + pageSize);
        const next = safeStart + pageSize < items.length ? String(safeStart + pageSize) : undefined;
        return { items: slice, nextCursor: next };
    }

    private isLegacyMethod(method: string): boolean {
        return method === 'ping'
            || method === 'getHostInfo'
            || method === 'listTools'
            || method === 'callTool'
            || method === 'listResources'
            || method === 'readResource'
            || method === 'listPrompts';
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
