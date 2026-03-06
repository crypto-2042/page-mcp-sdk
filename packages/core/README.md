# @page-mcp/core

Core package for the Page MCP SDK. Provides `PageMcpHost`, `PageMcpClient`, `EventBus`, `SkillRunner`, WebMCP Polyfill, and cross-context Transports.

> 🌐 **Live Preview:** [https://page-mcp.org](https://page-mcp.org)

## Features

- 🔧 **PageMcpHost** — Register tools, resources, and skills on the page side
- 🤖 **PageMcpClient** — Discover and invoke page capabilities from the AI side
- 🔌 **ITransport** — Pluggable transport interface for flexible communication
- 🚌 **EventBus** — In-memory transport for same-context usage
- 📨 **PostMessageTransport** — Cross-context transport via `window.postMessage` (Content Script ↔ Page)
- 🧩 **ChromeRuntimeTransport** — Chrome Extension transport via `chrome.runtime` messaging
- 🌍 **WebMCP Polyfill** — Polyfills `navigator.modelContext.registerTool()` for all browsers
- 🚀 **SkillRunner** — Execute multi-step skill workflows with data passing and validation
- 📦 **Zero dependencies** — No third-party runtime dependencies

## Installation

```bash
npm install @page-mcp/core
```

## Quick Start

### Same-Context Usage (EventBus)

```typescript
import { PageMcpHost, PageMcpClient, EventBus, installWebMcpPolyfill } from '@page-mcp/core';

// 1. Create shared communication bus
const bus = new EventBus();

// 2. Page side: register tools (WebMCP-aligned)
const host = new PageMcpHost({ name: 'my-app', version: '1.0', bus });

host.registerTool({
  name: 'searchProducts',
  description: 'Search products by keyword',
  inputSchema: {
    type: 'object',
    properties: {
      keyword: { type: 'string', description: 'Search keyword' }
    },
    required: ['keyword']
  },
  execute: async (input) => {
    return await searchProducts(input.keyword as string);
  }
});

host.start();

// 3. Install WebMCP polyfill (optional — enables navigator.modelContext API)
installWebMcpPolyfill(host);

// 4. AI side: discover and invoke
const client = new PageMcpClient({ bus });
await client.connect();

const tools = await client.listTools();
const result = await client.callTool('searchProducts', { keyword: 'headphones' });
```

### Browser Extension (PostMessageTransport)

```typescript
// === Page Script (inject or existing page code) ===
import { PageMcpHost, PostMessageTransport } from '@page-mcp/core';

const transport = new PostMessageTransport({ role: 'host', channel: 'page-mcp' });
const host = new PageMcpHost({ name: 'my-app', version: '1.0', transport });

host.registerTool({ /* ... */ });
host.start();

// === Content Script ===
import { PageMcpClient, PostMessageTransport } from '@page-mcp/core';

const transport = new PostMessageTransport({ role: 'client', channel: 'page-mcp' });
const client = new PageMcpClient({ transport });
await client.connect();

const tools = await client.listTools();
```

### Chrome Extension Background ↔ Content Script (ChromeRuntimeTransport)

```typescript
// === Content Script ===
import { ChromeRuntimeTransport } from '@page-mcp/core';

const transport = new ChromeRuntimeTransport({ channel: 'page-mcp' });
// Use as Host or Client depending on architecture

// === Background Script ===
import { PageMcpClient, ChromeRuntimeTransport } from '@page-mcp/core';

const transport = new ChromeRuntimeTransport({ tabId: activeTabId, channel: 'page-mcp' });
const client = new PageMcpClient({ transport });
await client.connect();
```

## API

### `ITransport` (Interface)

The pluggable transport interface that all transports implement:

```typescript
interface ITransport {
  request(method: RpcMethod, params?: Record<string, unknown>): Promise<RpcResponse>;
  onRequest(handler: (request: RpcRequest) => Promise<RpcResponse>): void;
  on(event: string, callback: (data: unknown) => void): void;
  off(event: string, callback: (data: unknown) => void): void;
  emit(event: string, data?: unknown): void;
  destroy(): void;
}
```

### `EventBus` (implements `ITransport`)

In-memory transport for same-context Host ↔ Client communication.

```typescript
const bus = new EventBus({ timeout: 10000 }); // RPC timeout, default 10s
bus.on('rpc:request', (req) => { /* log */ });
bus.on('rpc:response', (res) => { /* log */ });
bus.destroy();
```

### `PostMessageTransport` (implements `ITransport`)

Cross-context transport via `window.postMessage`. Used for Content Script ↔ Page communication.

```typescript
const transport = new PostMessageTransport({
  channel: 'page-mcp',        // Channel identifier (both sides must match)
  targetOrigin: '*',           // postMessage target origin
  timeout: 10000,              // RPC timeout
  role: 'host',                // 'host' | 'client' | undefined
});
```

### `ChromeRuntimeTransport` (implements `ITransport`)

Chrome Extension messaging transport via `chrome.runtime`. Supports one-shot and long-lived Port connections.

```typescript
const transport = new ChromeRuntimeTransport({
  channel: 'page-mcp',        // Channel identifier
  timeout: 10000,              // RPC timeout
  usePort: false,              // true = long-lived Port, false = one-shot sendMessage
  portName: 'page-mcp-port',   // Port name (when usePort: true)
  tabId: 123,                  // Tab ID for Background → Content Script
});
```

### `PageMcpHost`

```typescript
const host = new PageMcpHost({ name: 'app', version: '1.0', transport });

host.registerTool(toolDef);       // Register tool (WebMCP aligned)
host.registerResource(resDef);    // Register resource
host.registerSkill(skillDef);     // Register skill

host.start();                     // Start listening for RPC requests
host.getTransport();              // Get transport instance
host.getBus();                    // Get EventBus (deprecated, throws if not EventBus)
host.destroy();                   // Cleanup
```

### `PageMcpClient`

```typescript
const client = new PageMcpClient({ transport, connectTimeout: 5000 });
await client.connect();

await client.listTools();
await client.callTool(name, args);
await client.listResources();
await client.readResource(uri);
await client.listSkills();
await client.executeSkill(name, args);

client.getTransport();             // Get transport instance
client.disconnect();
```

### WebMCP Polyfill

```typescript
import { installWebMcpPolyfill, isWebMcpSupported } from '@page-mcp/core';

isWebMcpSupported(); // Check native support
installWebMcpPolyfill(host); // Install polyfill
installWebMcpPolyfill(host, { force: true }); // Force override

// Standard API:
navigator.modelContext.registerTool({ name: 'myTool', ... });
```

## Transport Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser Extension                        │
│  ┌──────────────┐   chrome.runtime   ┌──────────────────┐   │
│  │  Popup / UI  │ ◄───────────────► │  Background SW   │   │
│  └──────────────┘                    └───────┬──────────┘   │
│                              ChromeRuntimeTransport         │
│  ┌───────────────────────────────────────────┼──────────┐   │
│  │              Content Script               │          │   │
│  │                                     Bridge/Relay     │   │
│  │             PostMessageTransport                     │   │
│  └──────────────┬───────────────────────────────────────┘   │
│                 │  (JS isolation boundary)                   │
│  ┌──────────────┼───────────────────────────────────────┐   │
│  │    Web Page   │                                      │   │
│  │   ┌──────────▼───┐                                   │   │
│  │   │ PageMcpHost  │  (PostMessageTransport)           │   │
│  │   └──────────────┘                                   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

Same-context (in-page):
┌─────────────────────────────────────────┐
│               Web Page                  │
│  ┌────────────┐     ┌──────────────┐    │
│  │ PageMcpHost│◄───►│PageMcpClient │    │
│  └─────┬──────┘     └──────┬───────┘    │
│        └──────┬───────────┘             │
│         ┌─────▼─────┐                   │
│         │  EventBus │                   │
│         └───────────┘                   │
└─────────────────────────────────────────┘
```

For detailed documentation, see the [main README](../../README.md).

## License

MIT
