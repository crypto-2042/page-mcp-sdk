// ============================================================
// Page MCP SDK — Shared Type Definitions
// Aligned with WebMCP W3C Standard (webmachinelearning.github.io/webmcp)
// ============================================================

// ------ JSON Schema (simplified) ------

export interface JsonSchema {
    type: 'object' | 'string' | 'number' | 'boolean' | 'array';
    properties?: Record<string, JsonSchema & { default?: unknown; description?: string; pattern?: string }>;
    required?: string[];
    items?: JsonSchema;
    description?: string;
}

// ------ Tool Annotations (WebMCP §4.2.2) ------

export interface ToolAnnotations {
    /** If true, the tool does not modify state and only reads data */
    readOnlyHint?: boolean;
}

// ------ Tool (WebMCP-aligned: ModelContextTool) ------

/**
 * Tool definition — aligned with WebMCP's `ModelContextTool` dictionary.
 *
 * WebMCP spec fields:
 * - `name` (required) — unique tool identifier
 * - `description` (required) — natural language description
 * - `inputSchema` (optional) — JSON Schema for input parameters
 * - `execute` (required) — callback invoked by the agent
 * - `annotations` (optional) — metadata hints (e.g. readOnlyHint)
 */
export interface ToolDefinition {
    name: string;
    title?: string;
    description: string;
    inputSchema?: JsonSchema;
    outputSchema?: JsonSchema;
    securitySchemes?: Array<Record<string, unknown>>;
    execute: (input: Record<string, unknown>) => Promise<unknown>;
    annotations?: ToolAnnotations;
}

/** Tool info exposed to the client (no execute callback) */
export interface ToolInfo {
    name: string;
    title?: string;
    description: string;
    inputSchema?: JsonSchema;
    outputSchema?: JsonSchema;
    securitySchemes?: Array<Record<string, unknown>>;
    annotations?: ToolAnnotations;
}

// ------ Resource (Page MCP extension, beyond WebMCP) ------

export interface ResourceDefinition {
    uri: string;
    name: string;
    description: string;
    mimeType?: string;
    handler: () => Promise<ResourceReadResult | unknown>;
}

/** Resource info exposed to the client (no handler) */
export interface ResourceInfo {
    uri: string;
    name: string;
    description: string;
    mimeType?: string;
}

export interface ResourceContent {
    uri: string;
    mimeType: string;
    text?: string;
    blob?: string;
}

export interface ResourceReadResult {
    contents: ResourceContent[];
}

// ------ Skills Extension (non-standard MCP extension) ------

export interface SkillExecutionContext {
    callTool: (name: string, args?: Record<string, unknown>) => Promise<unknown>;
    readResource: (uri: string) => Promise<unknown>;
    getPrompt: (name: string, args?: Record<string, unknown>) => Promise<unknown>;
    requestUserInteraction?: (request: unknown) => Promise<unknown>;
}

export interface SkillDefinition {
    name: string;
    version: string;
    description?: string;
    skillMd: string;
    scriptJs?: string;
    inputSchema?: JsonSchema;
    outputSchema?: JsonSchema;
    annotations?: Record<string, unknown>;
    run?: (ctx: SkillExecutionContext, input: Record<string, unknown>) => Promise<unknown>;
}

export interface SkillInfo {
    name: string;
    version: string;
    description?: string;
    hasScript: boolean;
    inputSchema?: JsonSchema;
    outputSchema?: JsonSchema;
    annotations?: Record<string, unknown>;
}

export interface SkillGetResult {
    name: string;
    version: string;
    description?: string;
    skillMd: string;
    hasScript: boolean;
    inputSchema?: JsonSchema;
    outputSchema?: JsonSchema;
    annotations?: Record<string, unknown>;
}

export interface SkillExecutionResult {
    name: string;
    success: boolean;
    output?: unknown;
    error?: string;
}

// ------ Prompt (Page MCP extension: predefined AI conversation starters) ------

export interface PromptDefinition {
    /** Unique identifier */
    name: string;
    description: string;
    arguments?: PromptArgument[];
    handler: (args: Record<string, unknown>) => Promise<PromptGetResult>;
}

export interface PromptInfo {
    name: string;
    description: string;
    arguments?: PromptArgument[];
}

export interface PromptArgument {
    name: string;
    description?: string;
    required?: boolean;
}

export interface PromptMessageContent {
    type: 'text';
    text: string;
}

export interface PromptMessage {
    role: 'assistant' | 'user' | 'system';
    content: PromptMessageContent;
}

export interface PromptGetResult {
    messages: PromptMessage[];
}

// ------ Transport Interface ------

type TransportListener = (data: unknown) => void;
type TransportRpcHandler = (request: RpcRequest) => Promise<RpcResponse>;

/**
 * Abstract transport interface for Host ↔ Client communication.
 *
 * Implementations:
 * - `EventBus`               — In-memory (same JS context)
 * - `PostMessageTransport`   — window.postMessage (Content Script ↔ Page)
 * - `ChromeRuntimeTransport` — chrome.runtime messaging (Extension ↔ Content Script)
 */
export interface ITransport {
    /** Send an RPC request and wait for a response (Client side) */
    request(method: RpcMethod, params?: Record<string, unknown>): Promise<RpcResponse>;

    /** Register a handler for incoming RPC requests (Host side) */
    onRequest(handler: TransportRpcHandler): void;

    /** Subscribe to a named event */
    on(event: string, callback: TransportListener): void;

    /** Unsubscribe from a named event */
    off(event: string, callback: TransportListener): void;

    /** Emit a named event */
    emit(event: string, data?: unknown): void;

    /** Clean up all listeners and pending requests */
    destroy(): void;
}

// ------ RPC Messages ------

export type RpcMethod =
    // MCP standard methods
    | 'initialize'
    | 'tools/list'
    | 'tools/call'
    | 'resources/list'
    | 'resources/read'
    | 'prompts/list'
    | 'prompts/get'
    | 'extensions/skills/list'
    | 'extensions/skills/get'
    | 'extensions/skills/execute'
    | 'notifications/tools/list_changed'
    | 'notifications/resources/list_changed'
    | 'notifications/prompts/list_changed'
    // Legacy methods (to be removed in v2 protocol migration)
    | 'ping'
    | 'getHostInfo'
    | 'listTools'
    | 'callTool'
    | 'listResources'
    | 'readResource'
    | 'listPrompts';

export interface RpcRequest {
    id: string;
    method: RpcMethod;
    params?: Record<string, unknown>;
}

export interface RpcResponse {
    id: string;
    result?: unknown;
    error?: { code: number; message: string };
}

// ------ Host Info ------

export interface HostInfo {
    name: string;
    version: string;
    capabilities?: {
        tools?: { listChanged?: boolean };
        resources?: { listChanged?: boolean };
        prompts?: { listChanged?: boolean };
        extensions?: {
            skills?: {
                version?: string;
                execute?: boolean;
                scriptExecution?: 'disabled' | 'inline-js';
            };
        };
    };
}
