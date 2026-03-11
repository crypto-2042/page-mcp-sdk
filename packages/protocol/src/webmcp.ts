// ============================================================
// Page MCP Protocol — WebMCP tool execution layer
// ============================================================

import type { AnthropicMcpTool } from './anthropic-mcp.js';

export type WebMcpToolExecute = (input: Record<string, unknown>) => Promise<unknown>;

export interface WebMcpTool extends AnthropicMcpTool {
  execute: WebMcpToolExecute;
}
