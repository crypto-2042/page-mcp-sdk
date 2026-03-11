export type {
  JsonSchema,
  AnthropicMcpToolAnnotations,
  AnthropicMcpTool,
  AnthropicMcpResource,
  AnthropicMcpResourceContent,
  AnthropicMcpResourceReadResult,
  AnthropicMcpPromptArgument,
  AnthropicMcpPromptMessageContent,
  AnthropicMcpPromptMessage,
  AnthropicMcpPrompt,
  AnthropicMcpPromptGetResult,
} from './anthropic-mcp.js';

export type {
  WebMcpTool,
  WebMcpToolExecute,
} from './webmcp.js';

export type {
  PageMcpToolDefinition,
  PageMcpResourceDefinition,
  PageMcpPromptDefinition,
} from './page-mcp.js';

export type {
  McpMethod,
  McpRequest,
  McpError,
  McpResponse,
  McpListParams,
  McpListResult,
} from './mcp-types.js';

export { MCP_METHODS } from './mcp-types.js';
