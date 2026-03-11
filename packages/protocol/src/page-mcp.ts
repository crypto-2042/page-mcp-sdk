// ============================================================
// Page MCP Protocol — Page-specific protocol wrappers
// ============================================================

import type {
  AnthropicMcpPrompt,
  AnthropicMcpPromptMessage,
  AnthropicMcpPromptGetResult,
  AnthropicMcpResource,
} from './anthropic-mcp.js';
import type { WebMcpTool } from './webmcp.js';

export interface PageMcpToolDefinition extends WebMcpTool {}

export interface PageMcpResourceDefinition extends AnthropicMcpResource {
  mimeType?: 'text/plain' | 'text/html' | 'application/json';
}

export interface PageMcpPromptDefinition extends AnthropicMcpPrompt {
  messages?: AnthropicMcpPromptMessage[];
  handler?: (args: Record<string, unknown>) => Promise<AnthropicMcpPromptGetResult>;
}
