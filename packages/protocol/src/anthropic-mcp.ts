// ============================================================
// Page MCP Protocol — Anthropic MCP type surface
// ============================================================

export interface JsonSchema {
  type: 'object' | 'string' | 'number' | 'boolean' | 'array';
  properties?: Record<string, JsonSchema & { default?: unknown; description?: string; pattern?: string }>;
  required?: string[];
  items?: JsonSchema;
  description?: string;
}

export interface AnthropicMcpToolAnnotations {
  title?: string;
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
}

export interface AnthropicMcpTool {
  name: string;
  title?: string;
  description: string;
  inputSchema?: JsonSchema;
  outputSchema?: JsonSchema;
  annotations?: AnthropicMcpToolAnnotations;
}

export interface AnthropicMcpResource {
  uri: string;
  name: string;
  description: string;
  mimeType?: string;
}

export interface AnthropicMcpResourceContent {
  uri: string;
  mimeType: string;
  text?: string;
  blob?: string;
}

export interface AnthropicMcpResourceReadResult {
  contents: AnthropicMcpResourceContent[];
}

export interface AnthropicMcpPromptArgument {
  name: string;
  description?: string;
  required?: boolean;
}

export interface AnthropicMcpPromptMessageContent {
  type: 'text';
  text: string;
}

export interface AnthropicMcpPromptMessage {
  role: 'assistant' | 'user' | 'system';
  content: AnthropicMcpPromptMessageContent;
}

export interface AnthropicMcpPrompt {
  name: string;
  description: string;
  arguments?: AnthropicMcpPromptArgument[];
}

export interface AnthropicMcpPromptGetResult {
  messages: AnthropicMcpPromptMessage[];
}
