<p align="center">
  <h1 align="center">Page MCP SDK</h1>
</p>

<p align="center">
  <strong>MCP-Aligned Web Page SDK — Let web pages explain themselves to AI via standardized tools, resources, prompts, and skills extensions</strong>
</p>

<p align="center">
  <a href="https://page-mcp.org">🌐 Live Demo</a> ·
  <a href="#packages">Packages</a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="#core-concepts">Concepts</a> ·
  <a href="#framework-adapters">Frameworks</a> ·
  <a href="#api-reference">API</a> ·
  <a href="./README.zh-CN.md">中文文档</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License" />
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg" alt="Node" />
  <img src="https://img.shields.io/badge/pnpm-%3E%3D8-orange.svg" alt="pnpm" />
  <img src="https://img.shields.io/badge/WebMCP-compatible-blueviolet.svg" alt="WebMCP" />
</p>

---

## Table of Contents

- [Overview](#overview)
- [Relationship with WebMCP](#relationship-with-webmcp)
- [Packages](#packages)
- [Quick Start](#quick-start)
  - [Installation](#installation)
  - [Basic Example (Vanilla JS)](#basic-example-vanilla-js)
  - [Script Tag (CDN / IIFE)](#script-tag-cdn--iife)
- [Core Concepts](#core-concepts)
  - [Tools — WebMCP Aligned](#tools--webmcp-aligned)
  - [Resources — Beyond WebMCP](#resources--beyond-webmcp)
  - [Skills — Beyond WebMCP](#skills--beyond-webmcp)
  - [WebMCP Adapter](#webmcp-adapter)
  - [Chat Widget](#chat-widget)
- [Framework Adapters](#framework-adapters)
  - [React](#react-page-mcpreact)
  - [Vue 3](#vue-3-page-mcpvue3)
  - [Vue 2](#vue-2-page-mcpvue2)
- [API Reference](#api-reference)
- [Demo](#demo)
- [Development](#development)
- [License](#license)

---

## Overview

AI Agents increasingly need to understand and interact with web pages. Traditional DOM scraping is fragile and inefficient. **Page MCP SDK** lets pages proactively describe their capabilities to AI through a structured MCP protocol:

- 🔧 **Tools** — Callable actions (e.g. "add to cart", "search products") — *WebMCP standard aligned*
- 📖 **Resources** — Readable data (e.g. "cart contents", "product catalog") — *Beyond WebMCP*
- 🚀 **Skills** — Multi-step workflows composing multiple tools (e.g. "place order") — *Beyond WebMCP*
- 💬 **Chat Widget** — Embeddable AI assistant that auto-discovers registered MCP tools

> 🌐 **Live Preview:** [https://page-mcp.org](https://page-mcp.org) — Try the TechMart e-commerce demo with AI assistant

```
┌─────────────────────────────────────────┐
│               Web Page                  │
│                                         │
│  ┌────────────┐     ┌──────────────┐    │
│  │  Page App  │     │  AI Widget   │    │
│  └─────┬──────┘     └──────┬───────┘    │
│        │                   │            │
│  ┌─────▼──────┐     ┌───-──▼───────┐    │
│  │ PageMcpHost│◄───►│PageMcpClient │    │
│  └─────┬──────┘     └─────┬──────-─┘    │
│        └──────┬───────────┘             │
│         ┌─────▼─────┐                   │
│         │  EventBus │                   │
│         └───────────┘                   │
└─────────────────────────────────────────┘
```

## Relationship with WebMCP

[WebMCP](https://github.com/niccolli/niccolli.github.io) is a W3C proposed standard by Google and Microsoft that enables pages to expose tools to AI agents via `navigator.modelContext.registerTool()`.

**This SDK is an MCP-aligned runtime + WebMCP browser adapter:**

| Capability | WebMCP Standard | This SDK |
|---|---|---|
| `registerTool()` | ✅ Browser native (limited availability) | ✅ Via `@page-mcp/webmcp-adapter` polyfill |
| `inputSchema` / `execute` | ✅ Standard fields | ✅ Fully aligned |
| `annotations.readOnlyHint` | ✅ Standard fields | ✅ Fully aligned |
| **Resources** | ❌ Not supported | ✅ `registerResource()` |
| **Skills (Workflows)** | ❌ Not supported | ✅ `registerSkill()` |
| **Chat Widget** | ❌ Not supported | ✅ `@page-mcp/chat` |
| **Framework Adapters** | ❌ Native JS only | ✅ React / Vue 3 / Vue 2 |
| **Auto-detection** | — | ✅ Uses native when available, adapter polyfills otherwise |

## Packages

| Package | Description | Size |
|---|---|---|
| [`@page-mcp/core`](./packages/core) | Core SDK — Host, Client, EventBus, Transports, MCP + Skills Extension APIs | ~13 KB |
| [`@page-mcp/webmcp-adapter`](./packages/webmcp-adapter) | Browser WebMCP adapter (polyfill + bridge to PageMcpHost) | ~3 KB |
| [`@page-mcp/chat`](./packages/chat) | Embeddable AI Chat Widget with OpenAI-compatible API + MCP | ~38 KB |
| [`@page-mcp/react`](./packages/react) | React adapter — Provider + Hooks | ~3 KB |
| [`@page-mcp/vue3`](./packages/vue3) | Vue 3 adapter — Plugin + Composables | ~3 KB |
| [`@page-mcp/vue2`](./packages/vue2) | Vue 2 adapter — Plugin + Mixin | ~2 KB |

## Quick Start

### Installation

```bash
# Core SDK (required)
npm install @page-mcp/core

# WebMCP adapter (optional)
npm install @page-mcp/webmcp-adapter

# AI Chat Widget (optional)
npm install @page-mcp/chat

# Framework adapter (pick one, optional)
npm install @page-mcp/react    # React
npm install @page-mcp/vue3     # Vue 3
npm install @page-mcp/vue2     # Vue 2
```

### Basic Example (Vanilla JS)

```typescript
import { PageMcpHost, PageMcpClient, EventBus } from '@page-mcp/core';
import { installWebMcpPolyfill } from '@page-mcp/webmcp-adapter';

// 1. Create shared communication bus
const bus = new EventBus();

// 2. Page side: register tools (WebMCP-aligned fields)
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

// 3. Install WebMCP polyfill (optional)
installWebMcpPolyfill(host);

// 4. AI side: discover and invoke
const client = new PageMcpClient({ bus });
await client.connect();

const tools = await client.toolsList();
console.log('Available tools:', tools);

const result = await client.toolsCall('searchProducts', { keyword: 'headphones' });
console.log('Search results:', result);
```

### Script Tag (CDN / IIFE)

```html
<script src="@page-mcp/core/dist/index.global.js"></script>
<script src="@page-mcp/chat/dist/index.global.js"></script>
<script>
  const bus = new PageMcpCore.EventBus();
  const host = new PageMcpCore.PageMcpHost({ name: 'my-app', version: '1.0', bus });

  host.registerTool({ /* ... */ });
  host.start();

  // Launch AI Chat Widget — auto-discovers registered tools
  PageMcpChat.init({
    bus,
    openai: { apiKey: 'sk-xxx', model: 'gpt-5.2' },
    theme: 'dark',
    position: 'bottom-right',
  });
</script>
```

## Core Concepts

### Tools — WebMCP Aligned

Tools are **single actions** that AI can invoke. The API fully aligns with WebMCP's `ModelContextTool`:

```typescript
// Read-only tool (with annotation)
host.registerTool({
  name: 'getProductInfo',
  description: 'Get product details by name',
  inputSchema: {
    type: 'object',
    properties: { productName: { type: 'string' } },
    required: ['productName']
  },
  annotations: { readOnlyHint: true },
  execute: async (input) => products.find(p => p.name === input.productName),
});

// Write tool
host.registerTool({
  name: 'addToCart',
  description: 'Add a product to the shopping cart',
  inputSchema: {
    type: 'object',
    properties: {
      productName: { type: 'string', description: 'Product name' },
      quantity: { type: 'number', description: 'Quantity (default: 1)' }
    },
    required: ['productName']
  },
  execute: async (input) => {
    return cartService.add(input.productName as string, (input.quantity as number) ?? 1);
  }
});
```

### Resources — Beyond WebMCP

Resources are **readable data** exposed by the page. Identified by URI, ideal for exposing page state and configuration.

```typescript
host.registerResource({
  uri: 'page://cart/items',
  name: 'Shopping Cart',
  description: 'Current shopping cart contents and total',
  handler: async () => ({
    items: cartService.getItems(),
    total: cartService.getTotal()
  })
});

// AI side
const cart = await client.resourcesRead('page://cart/items');
// => { items: [...], total: 299.97 }
```

### Skills — Beyond WebMCP

Skills are extension capabilities exposed through `extensions/skills/*` RPC methods. A skill must provide `name`, `version`, `skillMd`, and runtime logic (`run` or optional `scriptJs`).

```typescript
import { Extensions } from '@page-mcp/core';

host.registerSkill({
  name: 'cart-checkout',
  version: '1.0.0',
  description: 'Checkout flow for current cart',
  skillMd: '# cart-checkout\nCollect payment and submit order.',
  run: async (ctx, input) => {
    await ctx.callTool('addToCart', input);
    return ctx.callTool('placeOrder', {});
  }
});

const skills = Extensions.createSkillsClient(client);
await skills.list();
await skills.get('cart-checkout');
await skills.execute('cart-checkout', { productId: 'p1', quantity: 1 });
```

`scriptJs` notes:
- Registering `scriptJs` text is supported.
- Inline JS execution is disabled by default.
- Enable explicitly via `new PageMcpHost({ skills: { allowInlineScriptExecution: true } })`.

### WebMCP Adapter

```typescript
import { installWebMcpPolyfill, isWebMcpSupported } from '@page-mcp/webmcp-adapter';

// Check browser support
isWebMcpSupported(); // => boolean

// Install polyfill (skips if native support exists, unless force: true)
installWebMcpPolyfill(host);
installWebMcpPolyfill(host, { force: true }); // Force override

// Now the standard WebMCP API is available
navigator.modelContext.registerTool({
  name: 'myTool',
  description: 'A tool',
  execute: async (input) => ({ result: 'ok' }),
});
```

### Chat Widget

The `@page-mcp/chat` package provides an embeddable AI assistant that automatically discovers and uses registered MCP tools.

```typescript
import { init } from '@page-mcp/chat';

const widget = init({
  bus,                                             // MCP EventBus
  openai: {
    apiKey: 'sk-xxx',
    baseURL: 'https://api.openai.com/v1',          // Any OpenAI-compatible endpoint
    model: 'gpt-5.2',
  },
  theme: 'dark',                                   // 'dark' | 'light' | 'auto'
  position: 'bottom-right',                        // FAB position
  title: 'AI Assistant',
  accentColor: '#6366f1',
  welcomeMessage: 'Hi! How can I help you?',
});

// Programmatic control
widget.open();
widget.close();
widget.destroy();
```

## Framework Adapters

<details>
<summary><h3>React (<code>@page-mcp/react</code>)</h3></summary>

Provider component + Hooks following React best practices.

```tsx
import { PageMcpProvider, useRegisterTool, useRegisterResource } from '@page-mcp/react';

// Wrap your app
function App() {
  return (
    <PageMcpProvider name="my-app" version="1.0">
      <ProductPage />
    </PageMcpProvider>
  );
}

// Register tools in components
function ProductPage() {
  useRegisterTool({
    name: 'searchProducts',
    description: 'Search the product catalog',
    inputSchema: { type: 'object', properties: { keyword: { type: 'string' } }, required: ['keyword'] },
    execute: async (input) => products.filter(p => p.name.includes(input.keyword as string)),
  });

  useRegisterResource({
    uri: 'page://products',
    name: 'Product List',
    description: 'All products on this page',
    handler: async () => ({ products })
  });

  return <div>{/* UI */}</div>;
}
```

| Hook | Description |
|---|---|
| `usePageMcpHost()` | Get Host instance |
| `usePageMcpClient()` | Get Client instance |
| `usePageMcpBus()` | Get EventBus instance |
| `useRegisterTool(def)` | Register tool (auto-cleanup on unmount) |
| `useRegisterResource(def)` | Register resource |
| `useRegisterSkill(def)` | Register skill |

</details>

<details>
<summary><h3>Vue 3 (<code>@page-mcp/vue3</code>)</h3></summary>

Plugin + Composables.

```typescript
// main.ts
import { createApp } from 'vue';
import { PageMcpPlugin } from '@page-mcp/vue3';

const app = createApp(App);
app.use(PageMcpPlugin, { name: 'my-app', version: '1.0' });
app.mount('#app');
```

```vue
<script setup lang="ts">
import { useRegisterTool, usePageMcpClient } from '@page-mcp/vue3';

useRegisterTool({
  name: 'getFormData',
  description: 'Get current form data',
  inputSchema: { type: 'object', properties: {} },
  execute: async () => ({ name: formData.name, email: formData.email })
});

const client = usePageMcpClient();
</script>
```

| Composable | Description |
|---|---|
| `usePageMcpHost()` | Get Host instance |
| `usePageMcpClient()` | Get Client instance |
| `usePageMcpBus()` | Get EventBus instance |
| `useRegisterTool(def)` | Register tool |
| `useRegisterResource(def)` | Register resource |
| `useRegisterSkill(def)` | Register skill |

</details>

<details>
<summary><h3>Vue 2 (<code>@page-mcp/vue2</code>)</h3></summary>

Plugin + Mixin, accessible via `this.$pageMcp`.

```javascript
// main.js
import Vue from 'vue';
import { PageMcpPlugin } from '@page-mcp/vue2';
Vue.use(PageMcpPlugin, { name: 'my-app', version: '1.0' });
```

```javascript
// Component
export default {
  pageMcpTools: [
    {
      name: 'getTableData',
      description: 'Get current table data',
      inputSchema: { type: 'object', properties: {} },
      execute: async function() { return this.tableData; }
    }
  ],
  pageMcpResources: [
    {
      uri: 'page://table/data',
      name: 'Table Data',
      description: 'Data displayed in the table',
      handler: async () => ({ rows: store.state.tableData })
    }
  ]
};
```

| API | Description |
|---|---|
| `this.$pageMcp.host` | PageMcpHost instance |
| `this.$pageMcp.client` | PageMcpClient instance |
| `this.$pageMcp.bus` | EventBus instance |
| `pageMcpTools` option | Tools auto-registered on component create |
| `pageMcpResources` option | Resources auto-registered on component create |
| `pageMcpSkills` option | Skills auto-registered on component create |

</details>

## API Reference

### `EventBus`

Communication bus handling message passing between Host and Client.

```typescript
const bus = new EventBus({ timeout: 10000 }); // RPC timeout, default 10s

bus.on('rpc:request', (req) => { /* log */ });
bus.on('rpc:response', (res) => { /* log */ });
bus.destroy();
```

### `PageMcpHost`

Page-side host that registers Tools / Resources / Skills and handles AI requests.

```typescript
const bus = new EventBus();
const host = new PageMcpHost({ name: 'app', version: '1.0', bus });

host.registerTool(toolDef);       // Register tool (WebMCP aligned)
host.registerResource(resDef);    // Register resource
host.registerPrompt(promptDef);   // Register prompt
host.registerSkill(skillDef);     // Register extension skill

host.start();                     // Start listening for RPC requests
host.getTransport();              // Get transport instance
host.destroy();                   // Stop listening and cleanup
```

### `PageMcpClient`

AI-side client that discovers and invokes page capabilities.

```typescript
import { Extensions } from '@page-mcp/core';

const bus = new EventBus();
const client = new PageMcpClient({ bus, connectTimeout: 5000 });

await client.connect();
await client.initialize();
client.isConnected();
client.getHostInfo();

// Tools
await client.toolsList();
await client.toolsCall(name, args);

// Resources
await client.resourcesList();
await client.resourcesRead(uri);

// Prompts
await client.promptsList();
await client.promptsGet(name, args);

// Skills extensions
const skills = Extensions.createSkillsClient(client);
await skills.list();
await skills.execute(name, args);

client.disconnect();
```

### RPC Protocol

| Method | Description | Params |
|---|---|---|
| `initialize` | MCP handshake (protocol/capabilities/serverInfo) | `{ protocolVersion, capabilities, clientInfo }` |
| `tools/list` | List registered tools (RPC method) | `{ cursor?, limit? }` |
| `tools/call` | Invoke a tool (RPC method) | `{ name, arguments }` |
| `resources/list` | List registered resources (RPC method) | `{ cursor?, limit? }` |
| `resources/read` | Read a resource (RPC method) | `{ uri }` |
| `prompts/list` | List prompts (RPC method) | `{ cursor?, limit? }` |
| `prompts/get` | Resolve a prompt template (RPC method) | `{ name, arguments }` |
| `extensions/skills/list` | List registered skills (extension) | `{ cursor?, limit? }` |
| `extensions/skills/get` | Get skill detail (`skillMd`, metadata) | `{ name }` |
| `extensions/skills/execute` | Execute skill via `run` or `scriptJs` | `{ name, arguments }` |

Legacy compatibility methods `ping`, `getHostInfo`, `listTools`, `callTool`, `listResources`, `readResource`, `listPrompts` are still accepted in non-strict mode for migration.

## Demo

> 🌐 **Online Preview:** [https://page-mcp.org](https://page-mcp.org)

The project includes a comprehensive e-commerce demo (TechMart) showcasing all SDK capabilities:

```bash
# 1. Install dependencies and build
pnpm install
pnpm build

# 2. Start local server
npx serve .

# 3. Open http://localhost:3000/demo
```

The demo features:
- 🛍️ **E-Commerce Storefront** — Product grid, shopping cart, order history
- 🔧 **MCP Debug Console** — View registered tools/resources/skills and RPC traffic
- ⚙️ **AI Settings** — Configure API key, base URL, model, theme
- 💬 **AI Chat Widget** — Embedded assistant that interacts with the store via MCP

## Development

### Prerequisites

- Node.js >= 18
- pnpm >= 8

### Build

```bash
pnpm install
pnpm build          # Build all packages
pnpm build:core     # Build core only
pnpm build:chat     # Build chat widget only
pnpm typecheck      # Type check all packages
```

### Project Structure

```
page-mcp-sdk/
├── packages/
│   ├── core/               # @page-mcp/core
│   │   └── src/
│   │       ├── types.ts        # Shared types (WebMCP aligned)
│   │       ├── mcp-types.ts    # MCP-native method/type surface
│   │       ├── transport.ts    # EventBus communication layer
│   │       ├── host.ts         # PageMcpHost
│   │       ├── client.ts       # PageMcpClient
│   │       ├── extensions/     # Skills extension client/types
│   │       └── index.ts        # Public exports
│   ├── webmcp-adapter/     # @page-mcp/webmcp-adapter
│   ├── chat/               # @page-mcp/chat
│   │   └── src/
│   │       ├── chat-engine.ts  # AI chat engine (fetch-based)
│   │       ├── chat-widget.ts  # Web component UI
│   │       ├── styles.ts       # Theme & styles
│   │       ├── markdown.ts     # Markdown renderer
│   │       └── types.ts        # Chat types
│   ├── react/              # @page-mcp/react
│   ├── vue3/               # @page-mcp/vue3
│   └── vue2/               # @page-mcp/vue2
├── demo/
│   └── index.html          # TechMart e-commerce demo
├── pnpm-workspace.yaml
└── package.json
```

## Design Principles

1. **WebMCP Aligned** — Tool API is fully compatible with the W3C WebMCP standard
2. **Beyond the Standard** — Resources + Skills provide capabilities beyond WebMCP
3. **Native-First WebMCP** — Uses native browser WebMCP when available, adapter polyfills otherwise
4. **Framework Agnostic Core** — Core logic is not tied to any framework
5. **Zero Runtime Dependencies** — Core SDK has no third-party dependencies
6. **Pluggable Transport** — Communication layer is replaceable

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[MIT](./LICENSE)
