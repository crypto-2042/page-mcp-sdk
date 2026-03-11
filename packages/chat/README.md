# @page-mcp/chat

Embeddable chat UI package for Page MCP. Use it when you want a ready-to-drop chat widget that can automatically discover page capabilities exposed through `@page-mcp/core`.

## What This Package Does

- renders a browser chat widget
- connects to OpenAI-compatible chat APIs
- auto-discovers tools and prompts from a shared Page MCP bus/client
- supports direct API mode and endpoint mode

## When To Use It

Use `@page-mcp/chat` when:

- you want a working chat UI instead of building one from scratch
- you already expose tools/resources/prompts through `@page-mcp/core`
- you want the widget to automatically surface those capabilities to the model

If you only need runtime MCP wiring, use `@page-mcp/core` directly.

## Installation

```bash
npm install @page-mcp/core
npm install @page-mcp/chat
```

## Minimal Example

```ts
import { EventBus, PageMcpHost } from '@page-mcp/core';
import { init } from '@page-mcp/chat';

const bus = new EventBus();

const host = new PageMcpHost({
  name: 'demo-app',
  version: '1.0.0',
  bus,
});

host.registerTool({
  name: 'search_products',
  description: 'Search products by keyword',
  execute: async (input) => [{ keyword: String(input.keyword ?? '') }],
});

host.start();

const widget = init({
  bus,
  openai: {
    apiKey: 'sk-xxx',
    model: 'gpt-5.2',
  },
  title: 'AI Assistant',
  welcomeMessage: 'How can I help?',
});
```

## Two Operating Modes

### Direct API Mode

The widget sends requests directly to an OpenAI-compatible API from the browser.

Use when:

- browser-side API access is acceptable
- you want the smallest setup

### Endpoint Mode

The widget sends chat requests to your own backend endpoint.

Use when:

- you do not want API keys in the browser
- you need backend request shaping, auth, or observability

## Core Surface

- `init(config)`
  - create and mount the widget
- widget instance methods
  - `open()`
  - `close()`
  - `destroy()`

## Relationship To Other Packages

- `@page-mcp/core`
  - provides the host/client/bus used for capability discovery
- `@page-mcp/protocol`
  - provides the protocol types used by the chat engine internally

Use this package for the UI layer, not for low-level MCP runtime setup.
