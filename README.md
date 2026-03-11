# Page MCP SDK

Page MCP lets a web page describe its capabilities to AI in a structured way.

Instead of forcing agents to infer everything from raw DOM, the page can explicitly expose:

- what can be done
- what can be read
- what prompt shortcuts or workflows are available

That makes AI integrations more reliable, more explicit, and easier to maintain than selector-only automation.

## What Is Page MCP

Page MCP is a protocol + runtime approach for making web pages AI-readable and AI-operable.

At a high level:

- the page exposes structured capabilities
- the AI side discovers those capabilities
- the AI calls them through a stable interface instead of guessing from DOM alone

This project provides the packages needed to build that flow in browsers.

## What Problem It Solves

Most AI-on-the-web integrations start from the same problem:

- AI can see HTML, but not the page's real business semantics
- DOM scraping is fragile and tightly coupled to page structure
- important actions like "search", "add to cart", or "read checkout summary" are hidden behind implementation detail

Page MCP addresses this by letting the page say:

- "these are the actions I support"
- "these are the resources you can read"
- "these are the prompts or workflows available here"

So the AI no longer has to reverse-engineer everything from selectors.

## How It Works

1. The page registers tools, resources, prompts, or skills.
2. A client discovers those capabilities through Page MCP.
3. The AI calls the right capability through a structured interface.

```text
Web Page
  -> exposes capabilities with PageMcpHost
AI Client / Widget / Extension
  -> discovers and calls them with PageMcpClient
```

## Quick Start

### Install

```bash
npm install @page-mcp/core
```

### Minimal Example

```ts
import { EventBus, PageMcpClient, PageMcpHost } from '@page-mcp/core';

const bus = new EventBus();

const host = new PageMcpHost({
  name: 'demo-app',
  version: '1.0.0',
  bus,
});

host.registerTool({
  name: 'search_products',
  description: 'Search products by keyword',
  inputSchema: {
    type: 'object',
    properties: {
      keyword: { type: 'string' },
    },
    required: ['keyword'],
  },
  execute: async (input) => {
    return [{ keyword: String(input.keyword ?? '') }];
  },
});

host.start();

const client = new PageMcpClient({ bus });
await client.connect();

const tools = await client.toolsList();
const result = await client.toolsCall('search_products', { keyword: 'phone' });
```

If you want a fuller runtime guide, start with [`@page-mcp/core`](./packages/core).

## When To Use Page MCP

Page MCP is a good fit when:

- your page already has meaningful business actions
- AI should operate through explicit page capabilities instead of brittle scraping
- you want a stable interface between web UI and AI
- you are building internal tools, commerce flows, dashboards, forms, or content workflows

It is especially useful when "seeing the DOM" is not enough for an agent to understand what the page can really do.

## Packages

| Package | Responsibility |
|---|---|
| [`@page-mcp/core`](./packages/core) | Runtime implementation: host, client, transports, capability execution |
| [`@page-mcp/protocol`](./packages/protocol) | Shared protocol types and constants |
| [`@page-mcp/webmcp-adapter`](./packages/webmcp-adapter) | Browser-facing WebMCP polyfill and bridge |
| [`@page-mcp/chat`](./packages/chat) | Embeddable chat UI that can discover page capabilities |
| [`@page-mcp/react`](./packages/react) | React integration layer |
| [`@page-mcp/vue3`](./packages/vue3) | Vue 3 integration layer |
| [`@page-mcp/vue2`](./packages/vue2) | Vue 2 integration layer |

## Learn More

- Runtime usage: [`packages/core/README.md`](./packages/core/README.md)
- Protocol types: [`packages/protocol/README.md`](./packages/protocol/README.md)
- Browser adapter: [`packages/webmcp-adapter/README.md`](./packages/webmcp-adapter/README.md)
- Chat widget: [`packages/chat/README.md`](./packages/chat/README.md)
- React adapter: [`packages/react/README.md`](./packages/react/README.md)
- Vue 3 adapter: [`packages/vue3/README.md`](./packages/vue3/README.md)
- Vue 2 adapter: [`packages/vue2/README.md`](./packages/vue2/README.md)

## License

MIT
