// ============================================================
// Page MCP SDK — Public API
// ============================================================

// Classes
export { PageMcpHost } from './host.js';
export type { PageMcpHostOptions } from './host.js';

export { PageMcpClient } from './client.js';
export type { PageMcpClientOptions } from './client.js';

export { EventBus } from './transport.js';

// Transport implementations
export { PostMessageTransport } from './transports/postmessage.js';
export type { PostMessageTransportOptions } from './transports/postmessage.js';

export { ChromeRuntimeTransport } from './transports/chrome-runtime.js';
export type { ChromeRuntimeTransportOptions } from './transports/chrome-runtime.js';

// Types
export type {
    SkillDefinition,
    SkillInfo,
    SkillGetResult,
    SkillExecutionResult,
    SkillExecutionContext,
    RpcRequest,
    RpcResponse,
    RpcMethod,
    HostInfo,
    ITransport,
} from './types.js';

export * as Extensions from './extensions/skills.js';
