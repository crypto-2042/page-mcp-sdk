// ============================================================
// Page MCP SDK — WebMCP Polyfill
// Bridges our SDK to the WebMCP standard `navigator.modelContext`
// ============================================================

import type { ToolDefinition, ToolAnnotations, JsonSchema } from './types.js';

/**
 * WebMCP-compatible tool definition.
 * Matches the W3C `ModelContextTool` dictionary shape.
 */
export interface WebMcpTool {
    name: string;
    description: string;
    inputSchema?: Record<string, unknown>;
    execute: (input: Record<string, unknown>, client?: unknown) => Promise<unknown>;
    annotations?: ToolAnnotations;
}

/**
 * WebMCP-compatible ModelContext interface.
 * Mirrors `navigator.modelContext` from the W3C spec.
 */
export interface ModelContext {
    provideContext(options?: { tools?: WebMcpTool[] }): void;
    clearContext(): void;
    registerTool(tool: WebMcpTool): void;
    unregisterTool(name: string): void;
}

/** Check if the browser natively supports WebMCP */
export function isWebMcpSupported(): boolean {
    return (
        typeof navigator !== 'undefined' &&
        'modelContext' in navigator &&
        typeof (navigator as any).modelContext?.registerTool === 'function'
    );
}

/**
 * Install a polyfill for `navigator.modelContext` using our SDK's Host.
 *
 * If the browser already supports WebMCP natively, this is a no-op
 * (unless `force` is true).
 *
 * ```ts
 * import { installWebMcpPolyfill, PageMcpHost, EventBus } from '@page-mcp/core';
 *
 * const bus = new EventBus();
 * const host = new PageMcpHost({ name: 'my-app', version: '1.0', bus });
 * host.start();
 *
 * installWebMcpPolyfill(host);
 *
 * // Now the standard API works:
 * navigator.modelContext.registerTool({
 *   name: 'search',
 *   description: 'Search products',
 *   execute: async (input) => searchProducts(input.keyword),
 * });
 * ```
 */
export function installWebMcpPolyfill(
    host: { registerTool: (def: ToolDefinition) => unknown },
    options?: { force?: boolean }
): void {
    if (typeof navigator === 'undefined') return;
    if (isWebMcpSupported() && !options?.force) return;

    const toolMap = new Map<string, WebMcpTool>();

    const modelContext: ModelContext = {
        provideContext(opts?: { tools?: WebMcpTool[] }) {
            // Clear existing tools
            modelContext.clearContext();

            // Register new tools
            if (opts?.tools) {
                for (const tool of opts.tools) {
                    modelContext.registerTool(tool);
                }
            }
        },

        clearContext() {
            toolMap.clear();
        },

        registerTool(tool: WebMcpTool) {
            if (toolMap.has(tool.name)) {
                throw new DOMException(
                    `Tool "${tool.name}" is already registered`,
                    'InvalidStateError'
                );
            }
            if (!tool.name || !tool.description) {
                throw new DOMException(
                    'Tool name and description are required',
                    'InvalidStateError'
                );
            }

            toolMap.set(tool.name, tool);

            // Bridge to our SDK's Host
            try {
                host.registerTool({
                    name: tool.name,
                    description: tool.description,
                    inputSchema: tool.inputSchema as JsonSchema | undefined,
                    annotations: tool.annotations,
                    execute: async (input) => tool.execute(input),
                });
            } catch {
                // Already registered via SDK directly — skip
            }
        },

        unregisterTool(name: string) {
            if (!toolMap.has(name)) {
                throw new DOMException(
                    `Tool "${name}" is not registered`,
                    'InvalidStateError'
                );
            }
            toolMap.delete(name);
        },
    };

    // Install on navigator
    Object.defineProperty(navigator, 'modelContext', {
        value: modelContext,
        writable: false,
        configurable: true,
        enumerable: true,
    });
}

/**
 * Convert our SDK ToolDefinition to a WebMCP-compatible shape.
 * Useful when migrating to native WebMCP in the future.
 */
export function toWebMcpTool(def: ToolDefinition): WebMcpTool {
    return {
        name: def.name,
        description: def.description,
        inputSchema: def.inputSchema as Record<string, unknown> | undefined,
        execute: async (input) => def.execute(input),
        annotations: def.annotations,
    };
}

/**
 * Convert a WebMCP tool to our SDK ToolDefinition.
 * Useful for interop when consuming native WebMCP tools.
 */
export function fromWebMcpTool(tool: WebMcpTool): ToolDefinition {
    return {
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema as JsonSchema | undefined,
        execute: async (input) => tool.execute(input),
        annotations: tool.annotations,
    };
}
