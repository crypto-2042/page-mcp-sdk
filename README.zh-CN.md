# Page MCP SDK

Page MCP 让网页能够以结构化方式向 AI 描述自己的能力。

它不再让 Agent 只靠原始 DOM 去猜测页面语义，而是由页面明确暴露：

- 能做什么
- 能读什么
- 有哪些 prompt 快捷入口或工作流

这会比只依赖 selector 的自动化更稳定、更清晰，也更容易维护。

## Page MCP 是什么

Page MCP 是一套让网页对 AI 更可理解、更可操作的协议与运行时方案。

它的核心思路很简单：

- 页面主动暴露结构化能力
- AI 侧发现这些能力
- AI 通过稳定接口调用，而不是只靠 DOM 猜测

这个仓库提供了在浏览器里构建这套能力所需的包。

## 它解决什么问题

大多数网页 AI 集成都有同一个问题：

- AI 能看到 HTML，但看不到页面真正的业务语义
- DOM 抓取很脆弱，和页面结构强耦合
- 像“搜索”“加入购物车”“读取结算摘要”这类关键操作，往往都藏在实现细节里

Page MCP 的作用，就是让页面明确告诉 AI：

- “我支持这些动作”
- “你可以读取这些资源”
- “这里有这些 prompt 或工作流”

这样 AI 就不需要再从 selector 里反向推测整个页面能力。

## 它如何工作

1. 页面注册 tools、resources、prompts 或 skills。
2. Client 侧发现这些能力。
3. AI 通过结构化接口调用正确的能力。

```text
Web Page
  -> 通过 PageMcpHost 暴露能力
AI Client / Widget / Extension
  -> 通过 PageMcpClient 发现并调用
```

## 快速开始

### 安装

```bash
npm install @page-mcp/core
```

### 最小示例

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

如果你需要更完整的运行时接入说明，先看 [`@page-mcp/core`](./packages/core)。

## 什么时候适合使用 Page MCP

以下场景很适合使用 Page MCP：

- 页面本身已经有明确的业务动作
- 希望 AI 通过显式页面能力工作，而不是依赖脆弱抓取
- 希望网页 UI 和 AI 之间有一个稳定接口
- 你在做内部系统、电商流程、表单系统、后台面板或内容工作流

尤其是当“看见 DOM”依然不足以让 Agent 真正理解页面时，Page MCP 的价值会很明显。

## 包一览

| 包名 | 主要职责 |
|---|---|
| [`@page-mcp/core`](./packages/core) | 运行时实现：host、client、transports、能力执行 |
| [`@page-mcp/protocol`](./packages/protocol) | 共享协议类型与常量 |
| [`@page-mcp/webmcp-adapter`](./packages/webmcp-adapter) | 浏览器侧 WebMCP polyfill 与 bridge |
| [`@page-mcp/chat`](./packages/chat) | 可嵌入聊天 UI，可自动发现页面能力 |
| [`@page-mcp/react`](./packages/react) | React 集成层 |
| [`@page-mcp/vue3`](./packages/vue3) | Vue 3 集成层 |
| [`@page-mcp/vue2`](./packages/vue2) | Vue 2 集成层 |

## 进一步了解

- 运行时使用方式：[`packages/core/README.md`](./packages/core/README.md)
- 协议类型：[`packages/protocol/README.md`](./packages/protocol/README.md)
- 浏览器适配层：[`packages/webmcp-adapter/README.md`](./packages/webmcp-adapter/README.md)
- 聊天组件：[`packages/chat/README.md`](./packages/chat/README.md)
- React 适配器：[`packages/react/README.md`](./packages/react/README.md)
- Vue 3 适配器：[`packages/vue3/README.md`](./packages/vue3/README.md)
- Vue 2 适配器：[`packages/vue2/README.md`](./packages/vue2/README.md)

## License

MIT
