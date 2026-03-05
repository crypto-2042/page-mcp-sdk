// ============================================================
// Page MCP SDK — Public API
// ============================================================

// Classes
export { PageMcpHost } from './host.js';
export type { PageMcpHostOptions } from './host.js';

export { PageMcpClient } from './client.js';
export type { PageMcpClientOptions } from './client.js';

export { EventBus } from './transport.js';

export { SkillRunner } from './skill-runner.js';

// WebMCP Polyfill
export {
    installWebMcpPolyfill,
    isWebMcpSupported,
    toWebMcpTool,
    fromWebMcpTool,
} from './polyfill.js';
export type { WebMcpTool, ModelContext } from './polyfill.js';

// Types
export type {
    JsonSchema,
    ToolAnnotations,
    ToolDefinition,
    ToolInfo,
    ResourceDefinition,
    ResourceInfo,
    SkillStep,
    SkillDefinition,
    SkillInfo,
    SkillResult,
    PromptDefinition,
    PromptInfo,
    RpcRequest,
    RpcResponse,
    RpcMethod,
    HostInfo,
} from './types.js';
