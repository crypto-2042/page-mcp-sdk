# @page-mcp/webmcp-adapter

Browser adapter package for WebMCP-style integration. Use it when you need a browser-facing polyfill or bridge between WebMCP tool registration and a `PageMcpHost`.

## What This Package Does

- exposes `installWebMcpPolyfill()`
- detects native browser support with `isWebMcpSupported()`
- converts between browser-facing WebMCP tool objects and Page MCP tool definitions

## When To Use It

Use `@page-mcp/webmcp-adapter` when:

- you want `navigator.modelContext` style registration in browsers
- you need to bridge browser-facing WebMCP tools into `PageMcpHost`
- you want a compatibility layer above `@page-mcp/core`

Do not use it as the main runtime package. It depends on `@page-mcp/core` for host behavior.

## Installation

```bash
npm install @page-mcp/core
npm install @page-mcp/protocol
npm install @page-mcp/webmcp-adapter
```

## Minimal Example

```ts
import { PageMcpHost } from '@page-mcp/core';
import { installWebMcpPolyfill } from '@page-mcp/webmcp-adapter';

const host = new PageMcpHost({
  name: 'demo-app',
  version: '1.0.0',
});

host.start();
installWebMcpPolyfill(host);
```

After installation, browser code can register tools through the WebMCP-style surface.

## Core Exports

- `installWebMcpPolyfill()`
- `isWebMcpSupported()`
- `toWebMcpTool()`
- `fromWebMcpTool()`

## Relationship To Other Packages

- `@page-mcp/core`
  - provides `PageMcpHost`
- `@page-mcp/protocol`
  - provides shared protocol types/constants

Use `core` for runtime execution. Use this package only when you need the browser adapter layer.
