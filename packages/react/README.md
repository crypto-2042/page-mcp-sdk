# @page-mcp/react

React adapter for the Page MCP SDK. Provides a Provider component and Hooks for seamless integration.

> 🌐 **Live Preview:** [https://page-mcp.org](https://page-mcp.org)

## Installation

```bash
npm install @page-mcp/core @page-mcp/react
```

## Quick Start

### 1. Wrap Your App with Provider

```tsx
import { PageMcpProvider } from '@page-mcp/react';

function App() {
  return (
    <PageMcpProvider name="my-app" version="1.0">
      <MyPage />
    </PageMcpProvider>
  );
}
```

### 2. Register Tools in Components

```tsx
import { useRegisterTool, useRegisterResource } from '@page-mcp/react';

function ProductPage() {
  useRegisterTool({
    name: 'searchProducts',
    description: 'Search the product catalog',
    inputSchema: {
      type: 'object',
      properties: { keyword: { type: 'string' } },
      required: ['keyword']
    },
    execute: async (input) => products.filter(p => p.name.includes(input.keyword)),
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

### 3. Use Client for AI Integration

```tsx
import { usePageMcpClient } from '@page-mcp/react';

function AIWidget() {
  const client = usePageMcpClient();

  const handleClick = async () => {
    const tools = await client.toolsList();
    const result = await client.toolsCall('searchProducts', { keyword: 'headphones' });
    console.log(result);
  };

  return <button onClick={handleClick}>Ask AI</button>;
}
```

## API

| Hook | Description |
|---|---|
| `usePageMcpHost()` | Get the `PageMcpHost` instance |
| `usePageMcpClient()` | Get the `PageMcpClient` instance |
| `usePageMcpSkills()` | Get the Extensions skills client |
| `usePageMcpBus()` | Get the `EventBus` instance |
| `useRegisterTool(def)` | Register a tool (auto-cleanup on unmount) |
| `useRegisterResource(def)` | Register a resource (auto-cleanup on unmount) |
| `useRegisterSkill(def)` | Register a skill (auto-cleanup on unmount) |

## How It Works

- `PageMcpProvider` creates `EventBus`, `PageMcpHost`, and `PageMcpClient` instances and provides them via React Context.
- `useRegisterTool` / `useRegisterResource` / `useRegisterSkill` / `useRegisterPrompt` register capabilities on mount and automatically clean up on unmount.
- The Host is started automatically when the Provider mounts.

For detailed documentation, see the [main README](../../README.md#react-page-mcpreact).

## License

MIT
