// ============================================================
// Page MCP SDK — MCP-native protocol type surface
// ============================================================

export const MCP_METHODS = [
  'tools/list',
  'tools/call',
  'resources/list',
  'resources/read',
  'prompts/list',
  'prompts/get',
  'notifications/tools/list_changed',
  'notifications/resources/list_changed',
  'notifications/prompts/list_changed',
] as const;

export type McpMethod = (typeof MCP_METHODS)[number];

export interface McpRequest {
  id: string;
  method: McpMethod;
  params?: Record<string, unknown>;
}

export interface McpError {
  code: number;
  message: string;
  data?: unknown;
}

export interface McpResponse {
  id: string;
  result?: unknown;
  error?: McpError;
}

export interface McpListParams {
  cursor?: string;
  limit?: number;
}

export interface McpListResult<T> {
  items: T[];
  nextCursor?: string;
}
