// ============================================================
// Page MCP SDK — Shared Type Definitions
// Aligned with WebMCP W3C Standard (webmachinelearning.github.io/webmcp)
// ============================================================

import type { JsonSchema } from '@page-mcp/protocol';

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
