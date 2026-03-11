# @page-mcp/react

React integration package for Page MCP. Use it when you want React-native setup around `PageMcpHost` and `PageMcpClient` through a provider and hooks.

## What This Package Does

- creates a React provider around Page MCP runtime objects
- exposes hooks for host/client access
- exposes hooks for registering tools, resources, prompts, and skills

## When To Use It

Use `@page-mcp/react` when:

- your app is built with React
- you want Page MCP lifecycle to follow React component lifecycle
- you want resource/tool/prompt registration through hooks instead of manual wiring

Use `@page-mcp/core` directly when you are not in React.

## Installation

```bash
npm install @page-mcp/core
npm install @page-mcp/protocol
npm install @page-mcp/react
```

## Minimal Example

```tsx
import { PageMcpProvider, useRegisterTool, usePageMcpClient } from '@page-mcp/react';

function ProductPage() {
  useRegisterTool({
    name: 'search_products',
    description: 'Search products by keyword',
    execute: async (input) => [{ keyword: String(input.keyword ?? '') }],
  });

  const client = usePageMcpClient();

  return <button onClick={() => client.toolsList()}>Inspect tools</button>;
}

export function App() {
  return (
    <PageMcpProvider name="demo-app" version="1.0.0">
      <ProductPage />
    </PageMcpProvider>
  );
}
```

## Core Exports

- `PageMcpProvider`
- `usePageMcpHost()`
- `usePageMcpClient()`
- `usePageMcpBus()`
- `useRegisterTool()`
- `useRegisterResource()`
- `useRegisterPrompt()`
- `useRegisterSkill()`
- `usePageMcpSkills()`

## Relationship To Other Packages

- `@page-mcp/core`
  - runtime implementation
- `@page-mcp/protocol`
  - protocol types for registrations and metadata

Use this package for React ergonomics, not as a replacement for `core`.
