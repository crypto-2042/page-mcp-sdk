# @page-mcp/core

Core package for the Page MCP SDK. Provides `PageMcpHost`, `PageMcpClient`, `EventBus`, `SkillRunner`, and WebMCP Polyfill.

> 🌐 **Live Preview:** [https://page-mcp.org](https://page-mcp.org)

## Features

- 🔧 **PageMcpHost** — Register tools, resources, and skills on the page side
- 🤖 **PageMcpClient** — Discover and invoke page capabilities from the AI side
- 🔌 **EventBus** — Lightweight RPC communication layer between Host and Client
- 🧩 **WebMCP Polyfill** — Polyfills `navigator.modelContext.registerTool()` for all browsers
- 🚀 **SkillRunner** — Execute multi-step skill workflows with data passing and validation
- 📦 **Zero dependencies** — No third-party runtime dependencies

## Installation

```bash
npm install @page-mcp/core
```

## Quick Start

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

## API

### `EventBus`

```typescript
const bus = new EventBus({ timeout: 10000 }); // RPC timeout, default 10s
bus.on('rpc:request', (req) => { /* log */ });
bus.on('rpc:response', (res) => { /* log */ });
bus.destroy();
```

### `PageMcpHost`

```typescript
const host = new PageMcpHost({ name: 'app', version: '1.0', bus });

host.registerTool(toolDef);       // Register tool (WebMCP aligned)
host.registerResource(resDef);    // Register resource
host.registerSkill(skillDef);     // Register skill

host.start();                     // Start listening for RPC requests
host.getBus();                    // Get EventBus instance
host.destroy();                   // Cleanup
```

### `PageMcpClient`

```typescript
const client = new PageMcpClient({ bus, connectTimeout: 5000 });
await client.connect();

await client.listTools();
await client.callTool(name, args);
await client.listResources();
await client.readResource(uri);
await client.listSkills();
await client.executeSkill(name, args);

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

For detailed documentation, see the [main README](../../README.md).

## License

MIT
