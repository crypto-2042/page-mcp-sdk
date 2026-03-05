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
    description: string;
    inputSchema?: JsonSchema;
    execute: (input: Record<string, unknown>) => Promise<unknown>;
    annotations?: ToolAnnotations;
}

/** Tool info exposed to the client (no execute callback) */
export interface ToolInfo {
    name: string;
    description: string;
    inputSchema?: JsonSchema;
    annotations?: ToolAnnotations;
}

// ------ Resource (Page MCP extension, beyond WebMCP) ------

export interface ResourceDefinition {
    uri: string;
    name: string;
    description: string;
    handler: () => Promise<unknown>;
}

/** Resource info exposed to the client (no handler) */
export interface ResourceInfo {
    uri: string;
    name: string;
    description: string;
}

// ------ Skill (Page MCP extension, beyond WebMCP) ------

export interface SkillStep {
    /** Unique step name within the skill */
    name: string;
    /** Name of the registered tool to invoke */
    tool: string;
    /** Map skill args + previous step results to tool input */
    input: (args: Record<string, unknown>, prevResults: Record<string, unknown>) => Record<string, unknown>;
    /** Optional validation — return truthy to pass, falsy to fail */
    validate?: (result: unknown, args: Record<string, unknown>) => boolean;
    /** What to do on validation failure */
    onFail?: { error: string };
}

export interface SkillDefinition {
    name: string;
    description: string;
    inputSchema?: JsonSchema;
    steps: SkillStep[];
}

/** Skill info exposed to the client (steps names only, no handlers) */
export interface SkillInfo {
    name: string;
    description: string;
    inputSchema?: JsonSchema;
    steps: string[];
}

export interface SkillResult {
    success: boolean;
    steps: Record<string, unknown>;
    error?: string;
}

// ------ Prompt (Page MCP extension: predefined AI conversation starters) ------

export interface PromptDefinition {
    /** Unique identifier */
    name: string;
    /** User-facing title displayed on the card */
    title: string;
    /** Description for AI context */
    description: string;
    /** Emoji or icon URL (optional) */
    icon?: string;
    /** Pre-written prompt text sent to AI on click */
    prompt: string;
}

/** Prompt info exposed to the client (same shape — no server-only fields) */
export interface PromptInfo {
    name: string;
    title: string;
    description: string;
    icon?: string;
    prompt: string;
}

// ------ RPC Messages ------

export type RpcMethod =
    | 'ping'
    | 'getHostInfo'
    | 'listTools'
    | 'callTool'
    | 'listResources'
    | 'readResource'
    | 'listSkills'
    | 'executeSkill'
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
}
