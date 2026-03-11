# @page-mcp/core

Page MCP 的运行时实现包。需要在页面侧暴露能力、在 AI 侧连接客户端，或者在浏览器上下文之间传递 MCP 消息时，使用这个包。

协议类型与常量已经拆到 `@page-mcp/protocol`。`@page-mcp/core` 只负责 Host/Client/Transport 和运行时行为。

## 这个包负责什么

- 创建页面侧 `PageMcpHost`
- 创建 AI 侧 `PageMcpClient`
- 提供同上下文与跨上下文 transport
- 执行已注册的 tools、prompts、skills、声明式 resources
- 在读取 resource 时解析 `page://selector/...` 和 `page://xpath/...`

## 什么时候用它

以下场景使用 `@page-mcp/core`：

- 在页面上注册 tools、resources、prompts、skills
- 从 AI 侧发现并调用这些能力
- 在 page/content-script/background 之间桥接 MCP
- 在浏览器运行时中实际跑 Page MCP

如果你只需要共享协议类型与常量，使用 `@page-mcp/protocol` 即可。

## 安装

```bash
npm install @page-mcp/core
npm install @page-mcp/protocol        # 可选：只要协议类型/常量时使用
npm install @page-mcp/webmcp-adapter  # 可选：需要 WebMCP polyfill/bridge 时使用
```

## 快速开始

### 同上下文 Host / Client

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
      keyword: { type: 'string', description: 'Search keyword' },
    },
    required: ['keyword'],
  },
  execute: async (input) => {
    return [{ id: 'sku_1', keyword: String(input.keyword ?? '') }];
  },
});

host.start();

const client = new PageMcpClient({ bus });
await client.connect();

const tools = await client.toolsList();
const result = await client.toolsCall('search_products', { keyword: 'phone' });
```

## 常见使用方式

### 注册 Tool

Tool 用来承载可执行逻辑。

```ts
host.registerTool({
  name: 'sum',
  description: 'Sum two numbers',
  inputSchema: {
    type: 'object',
    properties: {
      a: { type: 'number' },
      b: { type: 'number' },
    },
    required: ['a', 'b'],
  },
  execute: async (input) => Number(input.a) + Number(input.b),
});
```

### 注册 Resource

`core` 中的 resource 是声明式的，真正读取 DOM 的逻辑由 host 根据 `uri` 统一解析。

```ts
host.registerResource({
  uri: 'page://selector/.product-title',
  name: 'Current Product Title',
  description: 'Visible title on the current page',
  mimeType: 'text/plain',
});
```

支持的 resource URI：

- `page://selector/<encoded-css-selector>`
- `page://xpath/<encoded-xpath>`

支持的 `mimeType`：

- `text/plain`：返回第一个命中节点的 `textContent`
- `text/html`：返回第一个命中节点的 `outerHTML`
- `application/json`：返回固定结构 `{ "content": ... }` 的 JSON 字符串

### 注册 Prompt

Prompt 是会生成 `messages` 的命名模板。

```ts
host.registerPrompt({
  name: 'checkout_assistant',
  description: 'Guide the user through checkout',
  arguments: [{ name: 'customer_name', required: true }],
  messages: [
    {
      role: 'assistant',
      content: {
        type: 'text',
        text: 'Hello {{customer_name}}. Ready to check out?',
      },
    },
  ],
});
```

只有当 prompt 需要模板替换之外的动态逻辑时，才需要使用 `handler`。

### 注册 Skill

Skill 是 Page MCP 的扩展能力，用来表达更高层的工作流。

```ts
host.registerSkill({
  name: 'cart-checkout',
  version: '1.0.0',
  skillMd: '# cart-checkout\nRun checkout flow.',
  run: async (ctx) => {
    await ctx.callTool('open_cart');
    return ctx.callTool('place_order');
  },
});
```

### 在 Client 侧发现和调用

```ts
await client.connect();

const tools = await client.listTools();
const resources = await client.listResources();
const prompts = await client.listPrompts();

const resource = await client.readResource('page://selector/.product-title');
const prompt = await client.getPrompt('checkout_assistant', { customer_name: 'Alice' });
```

## Transport 选择

### `EventBus`

适合同一个 JavaScript 上下文内的集成。

### `PostMessageTransport`

适合通过 `window.postMessage` 通信的场景，例如 page script ↔ content script。

### `ChromeRuntimeTransport`

适合通过 `chrome.runtime` 通信的场景，例如 background ↔ content script。

## 与其他包的关系

- `@page-mcp/protocol`
  - 只提供共享协议类型与常量
- `@page-mcp/webmcp-adapter`
  - 提供浏览器侧 WebMCP polyfill / bridge
- `@page-mcp/chat`
  - 基于 `core` 的可嵌入聊天 UI
- `@page-mcp/react`、`@page-mcp/vue3`、`@page-mcp/vue2`
  - 基于 `core` 的框架集成层

## 说明

- `core` 不再导出 `AnthropicMcpTool`、`PageMcpToolDefinition` 这类协议类型
- 这类类型请从 `@page-mcp/protocol` 导入
- resource 注册现在是声明式的，resource API 中不再包含按项定义的 `handler`
