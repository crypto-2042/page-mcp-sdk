# @page-mcp/chat

Page MCP 的可嵌入聊天 UI 包。需要一个开箱即用的聊天组件，并且希望它自动发现通过 `@page-mcp/core` 暴露出来的页面能力时，使用这个包。

## 这个包负责什么

- 渲染浏览器聊天组件
- 连接 OpenAI 兼容聊天接口
- 通过共享的 Page MCP bus/client 自动发现 tools 和 prompts
- 同时支持 direct API mode 和 endpoint mode

## 什么时候用它

以下场景使用 `@page-mcp/chat`：

- 你想直接接入一个现成聊天 UI，而不是自己从零写
- 你已经用 `@page-mcp/core` 暴露了 tools/resources/prompts
- 你希望聊天组件自动把这些能力暴露给模型

如果你只需要 MCP 运行时接线，请直接使用 `@page-mcp/core`。

## 安装

```bash
npm install @page-mcp/core
npm install @page-mcp/chat
```

## 最小示例

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

## 两种运行模式

### Direct API Mode

聊天组件直接从浏览器向 OpenAI 兼容接口发请求。

适用场景：

- 可以接受浏览器侧直接访问 API
- 希望接入方式最简单

### Endpoint Mode

聊天组件把请求发给你自己的后端接口。

适用场景：

- 不希望把 API Key 放到浏览器
- 需要后端统一做鉴权、请求整形或观测

## 核心接口

- `init(config)`
  - 创建并挂载聊天组件
- 组件实例方法
  - `open()`
  - `close()`
  - `destroy()`

## 与其他包的关系

- `@page-mcp/core`
  - 提供能力发现所需的 host/client/bus
- `@page-mcp/protocol`
  - 提供 chat engine 内部使用的协议类型

这个包负责 UI 层，不负责底层 MCP 运行时初始化。
