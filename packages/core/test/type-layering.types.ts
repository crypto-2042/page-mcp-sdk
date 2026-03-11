import type {
  AnthropicMcpTool,
  AnthropicMcpPrompt,
  AnthropicMcpPromptMessage,
  AnthropicMcpResource,
  AnthropicMcpResourceReadResult,
  WebMcpTool,
  WebMcpToolExecute,
  PageMcpToolDefinition,
  PageMcpPromptDefinition,
  PageMcpResourceDefinition,
} from '@page-mcp/protocol';

type Assert<T> = T;

type _AnthropicTool = Assert<AnthropicMcpTool>;
type _AnthropicPrompt = Assert<AnthropicMcpPrompt>;
type _AnthropicPromptMessage = Assert<AnthropicMcpPromptMessage>;
type _AnthropicResource = Assert<AnthropicMcpResource>;
type _AnthropicResourceReadResult = Assert<AnthropicMcpResourceReadResult>;
type _WebMcpTool = Assert<WebMcpTool>;
type _WebMcpToolExecute = Assert<WebMcpToolExecute>;
type _PageMcpToolDefinition = Assert<PageMcpToolDefinition>;
type _PageMcpPromptDefinition = Assert<PageMcpPromptDefinition>;
type _PageMcpResourceDefinition = Assert<PageMcpResourceDefinition>;

const _resourceDefinitionWithoutHandler: PageMcpResourceDefinition = {
  uri: 'page://selector/.product-title',
  name: 'Current Product Title',
  description: 'Visible title of the current product',
  mimeType: 'text/plain',
};

// @ts-expect-error legacy mixed export removed
import type { ToolDefinition } from '../src/index.js';
// @ts-expect-error legacy mixed export removed
import type { PromptDefinition } from '../src/index.js';
// @ts-expect-error legacy mixed export removed
import type { ResourceDefinition } from '../src/index.js';
// @ts-expect-error legacy mixed export removed
import type { ToolAnnotations } from '../src/index.js';
// @ts-expect-error protocol types moved to @page-mcp/protocol
import type { AnthropicMcpTool as CoreAnthropicMcpTool } from '../src/index.js';

export {};
