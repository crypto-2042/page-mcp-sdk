export {
  installWebMcpPolyfill,
  isWebMcpSupported,
  toWebMcpTool,
  fromWebMcpTool,
} from './polyfill.js';

export type {
  WebMcpTool,
  ModelContext,
} from './polyfill.js';

export type {
  JsonSchema,
  AnthropicMcpToolAnnotations,
  PageMcpToolDefinition,
} from '@page-mcp/protocol';
