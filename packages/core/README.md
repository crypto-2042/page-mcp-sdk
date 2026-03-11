# @page-mcp/core

`@page-mcp/core` is the runtime package for Page MCP. It provides the host/client primitives that let a web page expose MCP-compatible tools, resources, and prompts, and lets local callers discover and invoke them.

Use this package when you want to:

- register page capabilities from the browser
- expose MCP tools/resources/prompts through a local host
- connect a client to that host and invoke capabilities
- build higher-level adapters on top of the Page MCP runtime

If you only need shared protocol types and constants, use [`@page-mcp/protocol`](../protocol/README.md) instead.

## Installation

```bash
pnpm add @page-mcp/core
```

## What `core` Does

`@page-mcp/core` is responsible for runtime behavior, not protocol ownership.

- `PageMcpHost`
  Registers tools, resources, and prompts, then serves MCP requests locally.
- `PageMcpClient`
  Connects to a host and calls MCP methods such as `tools/list`, `tools/call`, `resources/read`, and `prompts/get`.
- transport + event plumbing
  Moves MCP requests and responses between host and client.
- resource URI resolution
  Resolves declarative page resources such as `page://selector/...` and `page://xpath/...`.

Protocol types now live in [`@page-mcp/protocol`](../protocol/README.md).

## Quick Start

### 1. Create a host

```ts
import { PageMcpHost } from '@page-mcp/core';

const host = new PageMcpHost();
```

### 2. Register a tool

```ts
host.registerTool({
  name: 'get_page_title',
  title: 'Get Page Title',
  description: 'Returns the current document title.',
  annotations: { readOnlyHint: true },
  execute: async () => ({
    title: document.title,
  }),
});
```

### 3. Register a declarative resource

```ts
host.registerResource({
  uri: 'page://selector/.product-name',
  name: 'Visible Product Names',
  description: 'Names of visible products on the current page.',
  mimeType: 'application/json',
});
```

### 4. Register a prompt

Simple prompts can be declared as templates using `messages`:

```ts
host.registerPrompt({
  name: 'recommend-products',
  description: 'Start a product recommendation conversation.',
  messages: [
    {
      role: 'user',
      content: {
        type: 'text',
        text: 'Recommend three products from the current page.',
      },
    },
  ],
});
```

Prompts with arguments can use `{{argName}}` placeholders:

```ts
host.registerPrompt({
  name: 'gift-ideas',
  description: 'Suggest gift ideas for a given budget.',
  arguments: [
    { name: 'budget', required: true, description: 'Maximum budget in USD' },
  ],
  messages: [
    {
      role: 'user',
      content: {
        type: 'text',
        text: 'Suggest gift ideas under ${{budget}} from the current page.',
      },
    },
  ],
});
```

If a prompt needs dynamic logic, `handler` is still available:

```ts
host.registerPrompt({
  name: 'page-summary',
  description: 'Summarize the current page state.',
  handler: async () => ({
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Summarize the current page titled "${document.title}".`,
        },
      },
    ],
  }),
});
```

### 5. Connect a client

```ts
import { PageMcpClient } from '@page-mcp/core';

const client = new PageMcpClient({ host });

const tools = await client.listTools();
const title = await client.callTool('get_page_title', {});
```

## Common Patterns

### Tools

Use tools for actions, side effects, and custom logic.

Typical examples:

- submit a form
- add an item to cart
- run a page-specific workflow
- return computed or business-level JSON

### Resources

Use resources for declarative page reads.

`@page-mcp/core` supports these URI forms:

- `page://selector/<encoded-css-selector>`
- `page://xpath/<encoded-xpath>`

`mimeType` controls how the result is read:

- `text/plain`
  Reads the first matched node's `textContent`
- `text/html`
  Reads the first matched node's `outerHTML`
- `application/json`
  Returns a JSON payload shaped as `{ "content": ... }`

For `application/json`, the content is a lightweight text-oriented snapshot:

- single node without child elements -> `{"content":["node.textContent"]}`
- single node with child elements -> `{"content":["child0.textContent", ...]}`
- multiple nodes without child elements -> `{"content":["node1.textContent", "node2.textContent"]}`
- multiple nodes with child elements -> `{"content":[["node1.child0.textContent"], ["node2.child0.textContent"]]}`

### Prompts

Use prompts for user-controlled shortcuts.

- no-argument prompts work well as one-click shortcuts
- parameterized prompts should be invoked only after the caller supplies arguments
- simple prompts should prefer `messages` templates
- `handler` should be reserved for prompts that truly need dynamic logic

## Transport and Runtime Model

`PageMcpHost` keeps registered capabilities in memory and responds to MCP requests such as:

- `tools/list`
- `tools/call`
- `resources/list`
- `resources/read`
- `prompts/list`
- `prompts/get`

`PageMcpClient` talks to the host through the local runtime transport used by the SDK.

## Relationship to Other Packages

- [`@page-mcp/protocol`](../protocol/README.md)
  Pure protocol types and constants. Use this when you need shared MCP/WebMCP/PageMCP definitions.
- [`@page-mcp/webmcp-adapter`](../webmcp-adapter/README.md)
  Browser-side adapter and interoperability helpers.
- framework packages such as `@page-mcp/react`, `@page-mcp/vue3`, and `@page-mcp/vue2`
  Integration layers built on top of `core`.

## Structure Evolution

The package previously mixed protocol definitions and runtime implementation in the same place. That made field ownership unclear and made future extension harder.

The structure is now split into:

- `Anthropic MCP`
  Standard MCP object shapes and method constants
- `WebMCP`
  Browser-facing execution extensions
- `Page MCP`
  Page-specific registration/runtime definitions

Those pure protocol types now live in `@page-mcp/protocol`. `@page-mcp/core` remains the runtime implementation package.
