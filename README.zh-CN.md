<p align="center">
  <h1 align="center">Page MCP SDK</h1>
</p>

<p align="center">
  <strong>WebMCP Polyfill & Enhancement — 让网页自我解释，通过 MCP 协议将页面能力暴露给 AI</strong>
</p>

<p align="center">
  <a href="https://page-mcp.org">🌐 在线预览</a> ·
  <a href="#包一览">包一览</a> ·
  <a href="#快速开始">快速开始</a> ·
  <a href="#核心概念">核心概念</a> ·
  <a href="#框架适配">框架适配</a> ·
  <a href="#api-参考">API</a> ·
  <a href="./README.md">English</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License" />
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg" alt="Node" />
  <img src="https://img.shields.io/badge/pnpm-%3E%3D8-orange.svg" alt="pnpm" />
  <img src="https://img.shields.io/badge/WebMCP-compatible-blueviolet.svg" alt="WebMCP" />
</p>

---

## 目录

- [概述](#概述)
- [与 WebMCP 的关系](#与-webmcp-的关系)
- [包一览](#包一览)
- [快速开始](#快速开始)
  - [安装](#安装)
  - [最简示例（纯 JS）](#最简示例纯-js)
  - [Script Tag（CDN / IIFE）](#script-tagcdn--iife)
- [核心概念](#核心概念)
  - [Tools（工具）— WebMCP 对齐](#tools工具-webmcp-对齐)
  - [Resources（资源）— 超越 WebMCP](#resources资源-超越-webmcp)
  - [Skills（技能/工作流）— 超越 WebMCP](#skills技能工作流-超越-webmcp)
  - [WebMCP Polyfill](#webmcp-polyfill)
  - [Chat Widget（聊天组件）](#chat-widget聊天组件)
- [框架适配](#框架适配)
  - [React](#react-page-mcpreact)
  - [Vue 3](#vue-3-page-mcpvue3)
  - [Vue 2](#vue-2-page-mcpvue2)
- [API 参考](#api-参考)
- [Demo](#demo)
- [开发指南](#开发指南)
- [许可证](#许可证)

---

## 概述

AI Agent 越来越需要理解和操作网页。传统的 DOM 抓取既脆弱又低效。**Page MCP SDK** 让页面主动「自我解释」，通过结构化的 MCP 协议将能力暴露给 AI：

- 🔧 **Tools（工具）** — 可调用的操作（如「加入购物车」、「搜索商品」）— *与 WebMCP 标准对齐*
- 📖 **Resources（资源）** — 可读取的数据（如「购物车内容」、「商品目录」）— *超越 WebMCP*
- 🚀 **Skills（技能）** — 编排多个工具的工作流（如「智能下单」）— *超越 WebMCP*
- 💬 **Chat Widget（聊天组件）** — 可嵌入的 AI 助手，自动发现已注册的 MCP 工具

> 🌐 **在线预览：** [https://page-mcp.org](https://page-mcp.org) — 体验 TechMart 电商 Demo 及 AI 助手

```
┌──────────────────────────────────────────┐
│               Web Page                   │
│                                          │
│  ┌────────────┐     ┌──────────────┐     │
│  │   页面应用  │     │    AI 组件    │     │
│  └─────┬──────┘     └──────┬───────┘     │
│        │                   │             │
│  ┌─────▼──────┐     ┌─────▼───────┐      │
│  │ PageMcpHost│◄───►│PageMcpClient│      │
│  └─────┬──────┘     └─────┬───────┘      │
│        └──────┬───────────┘              │
│         ┌─────▼─────┐                    │
│         │  EventBus │                    │
│         └───────────┘                    │
└──────────────────────────────────────────┘
```

## 与 WebMCP 的关系

[WebMCP](https://github.com/niccolli/niccolli.github.io) 是 Google 和 Microsoft 联合提出的 W3C 标准，通过 `navigator.modelContext.registerTool()` 让页面暴露工具给 AI Agent。

**本 SDK 是 WebMCP 的 Polyfill + Enhancement：**

| 能力 | WebMCP 标准 | 本 SDK |
|---|---|---|
| `registerTool()` | ✅ 浏览器原生（仅 Chrome Canary） | ✅ Polyfill，全浏览器可用 |
| `inputSchema` / `execute` | ✅ 标准字段 | ✅ 完全对齐 |
| `annotations.readOnlyHint` | ✅ 标准字段 | ✅ 完全对齐 |
| **Resources（数据暴露）** | ❌ 不支持 | ✅ `registerResource()` |
| **Skills（工作流编排）** | ❌ 不支持 | ✅ `registerSkill()` |
| **Chat Widget（AI 聊天）** | ❌ 不支持 | ✅ `@page-mcp/chat` |
| **框架适配** | ❌ 仅原生 JS | ✅ React / Vue 3 / Vue 2 |
| **自动检测原生支持** | — | ✅ 有则用原生，无则 polyfill |

## 包一览

| 包名 | 描述 | 大小 |
|---|---|---|
| [`@page-mcp/core`](./packages/core) | 核心 SDK — Host、Client、EventBus、WebMCP Polyfill、SkillRunner | ~13 KB |
| [`@page-mcp/chat`](./packages/chat) | 可嵌入的 AI 聊天组件，支持 OpenAI 兼容 API + MCP | ~38 KB |
| [`@page-mcp/react`](./packages/react) | React 适配器 — Provider + Hooks | ~3 KB |
| [`@page-mcp/vue3`](./packages/vue3) | Vue 3 适配器 — Plugin + Composables | ~3 KB |
| [`@page-mcp/vue2`](./packages/vue2) | Vue 2 适配器 — Plugin + Mixin | ~2 KB |

## 快速开始

### 安装

```bash
# 核心 SDK（必需）
npm install @page-mcp/core

# WebMCP 适配器（可选）
npm install @page-mcp/webmcp-adapter

# AI 聊天组件（可选）
npm install @page-mcp/chat

# 选择一个框架适配器（可选）
npm install @page-mcp/react    # React
npm install @page-mcp/vue3     # Vue 3
npm install @page-mcp/vue2     # Vue 2
```

### 最简示例（纯 JS）

```typescript
import { PageMcpHost, PageMcpClient, EventBus } from '@page-mcp/core';
import { installWebMcpPolyfill } from '@page-mcp/webmcp-adapter';

// 1. 创建共享通信总线
const bus = new EventBus();

// 2. 页面侧：注册工具（WebMCP 标准字段）
const host = new PageMcpHost({ name: 'my-app', version: '1.0', bus });

host.registerTool({
  name: 'searchProducts',
  description: '搜索商品',
  inputSchema: {
    type: 'object',
    properties: {
      keyword: { type: 'string', description: '搜索关键词' }
    },
    required: ['keyword']
  },
  execute: async (input) => {
    return await searchProducts(input.keyword as string);
  }
});

host.start();

// 3. 安装 WebMCP polyfill（可选）
installWebMcpPolyfill(host);

// 4. AI 侧：发现并调用
const client = new PageMcpClient({ bus });
await client.connect();

const tools = await client.listTools();
console.log('可用工具:', tools);

const result = await client.callTool('searchProducts', { keyword: '耳机' });
console.log('搜索结果:', result);
```

### Script Tag（CDN / IIFE）

```html
<script src="@page-mcp/core/dist/index.global.js"></script>
<script src="@page-mcp/chat/dist/index.global.js"></script>
<script>
  const bus = new PageMcpCore.EventBus();
  const host = new PageMcpCore.PageMcpHost({ name: 'my-app', version: '1.0', bus });

  host.registerTool({ /* ... */ });
  host.start();

  // 启动 AI 聊天组件 — 自动发现已注册的工具
  PageMcpChat.init({
    bus,
    openai: { apiKey: 'sk-xxx', model: 'gpt-5.2' },
    theme: 'dark',
    position: 'bottom-right',
  });
</script>
```

## 核心概念

### Tools（工具）— WebMCP 对齐

工具是 AI 可以调用的**单次操作**。API 与 WebMCP 的 `ModelContextTool` 完全对齐：

```typescript
// 只读工具（带标注）
host.registerTool({
  name: 'getProductInfo',
  description: '根据名称获取商品详情',
  inputSchema: {
    type: 'object',
    properties: { productName: { type: 'string' } },
    required: ['productName']
  },
  annotations: { readOnlyHint: true },
  execute: async (input) => products.find(p => p.name === input.productName),
});

// 写入工具
host.registerTool({
  name: 'addToCart',
  description: '将商品加入购物车',
  inputSchema: {
    type: 'object',
    properties: {
      productName: { type: 'string', description: '商品名称' },
      quantity: { type: 'number', description: '数量，默认为 1' }
    },
    required: ['productName']
  },
  execute: async (input) => {
    return cartService.add(input.productName as string, (input.quantity as number) ?? 1);
  }
});
```

### Resources（资源）— 超越 WebMCP

资源是 AI 可以**读取的数据**。通过 URI 标识，适用于暴露页面状态、配置信息等。

> 💡 这是 Page MCP SDK 在 WebMCP 之上的增强能力。WebMCP 当前仅支持 Tools。

```typescript
host.registerResource({
  uri: 'page://cart/items',
  name: '购物车内容',
  description: '当前用户购物车中的所有商品',
  handler: async () => ({
    items: cartService.getItems(),
    total: cartService.getTotal()
  })
});

// AI 侧读取
const cart = await client.readResource('page://cart/items');
// => { items: [...], total: 299.97 }
```

### Skills（技能/工作流）— 超越 WebMCP

Skills 是多个 Tools 按步骤编排的**工作流**。每个步骤可以引用已注册的 Tool，支持步骤间数据传递和条件校验。

> 💡 这是 Page MCP SDK 在 WebMCP 之上的增强能力。

```typescript
host.registerSkill({
  name: 'smartOrder',
  description: '智能下单：查找商品 → 检查库存 → 加入购物车 → 下单',
  inputSchema: {
    type: 'object',
    properties: {
      productName: { type: 'string' },
      quantity: { type: 'number' }
    },
    required: ['productName']
  },
  steps: [
    {
      name: 'findProduct',
      tool: 'getProductInfo',
      input: (args) => ({ productName: args.productName }),
      validate: (result) => !!(result as any).name,
      onFail: { error: '商品未找到' }
    },
    {
      name: 'verifyStock',
      tool: 'checkStock',
      input: (args) => ({ productName: args.productName }),
      validate: (result, args) => (result as any).stock >= Number(args.quantity || 1),
      onFail: { error: '库存不足' }
    },
    {
      name: 'addItem',
      tool: 'addToCart',
      input: (args, prev) => ({
        productName: (prev.findProduct as any).name,
        quantity: args.quantity || 1
      })
    },
    {
      name: 'checkout',
      tool: 'placeOrder',
      input: () => ({})
    }
  ]
});

// 技能编排能力通过 Extensions 命名空间提供
// import { Extensions } from '@page-mcp/core';
// const runner = Extensions.createSkillRunner();
```

### WebMCP Polyfill

```typescript
import { installWebMcpPolyfill, isWebMcpSupported } from '@page-mcp/webmcp-adapter';

// 检测浏览器是否原生支持 WebMCP
isWebMcpSupported(); // => boolean

// 安装 polyfill（原生支持则跳过，除非 force: true）
installWebMcpPolyfill(host);
installWebMcpPolyfill(host, { force: true }); // 强制覆盖

// 现在标准 WebMCP API 可用了
navigator.modelContext.registerTool({
  name: 'myTool',
  description: '一个工具',
  execute: async (input) => ({ result: 'ok' }),
});
```

### Chat Widget（聊天组件）

`@page-mcp/chat` 提供可嵌入的 AI 助手，自动发现和使用已注册的 MCP 工具。

```typescript
import { init } from '@page-mcp/chat';

const widget = init({
  bus,                                             // MCP EventBus
  openai: {
    apiKey: 'sk-xxx',
    baseURL: 'https://api.openai.com/v1',          // 支持任何 OpenAI 兼容的端点
    model: 'gpt-5.2',
  },
  theme: 'dark',                                   // 'dark' | 'light' | 'auto'
  position: 'bottom-right',                        // 悬浮按钮位置
  title: 'AI 助手',
  accentColor: '#6366f1',
  welcomeMessage: '你好！有什么可以帮助你的？',
});

// 程控操作
widget.open();
widget.close();
widget.destroy();
```

## 框架适配

<details>
<summary><h3>React (<code>@page-mcp/react</code>)</h3></summary>

提供 Provider 组件 + Hooks，符合 React 最佳实践。

```tsx
import { PageMcpProvider, useRegisterTool, useRegisterResource } from '@page-mcp/react';

// 包裹应用
function App() {
  return (
    <PageMcpProvider name="my-app" version="1.0">
      <ProductPage />
    </PageMcpProvider>
  );
}

// 在组件中注册工具
function ProductPage() {
  useRegisterTool({
    name: 'searchProducts',
    description: '搜索商品列表',
    inputSchema: { type: 'object', properties: { keyword: { type: 'string' } }, required: ['keyword'] },
    execute: async (input) => products.filter(p => p.name.includes(input.keyword as string)),
  });

  useRegisterResource({
    uri: 'page://products',
    name: '商品列表',
    description: '当前页面展示的所有商品',
    handler: async () => ({ products })
  });

  return <div>{/* 页面 UI */}</div>;
}
```

| Hook | 描述 |
|---|---|
| `usePageMcpHost()` | 获取 Host 实例 |
| `usePageMcpClient()` | 获取 Client 实例 |
| `usePageMcpBus()` | 获取 EventBus 实例 |
| `useRegisterTool(def)` | 注册工具（组件卸载时自动清理） |
| `useRegisterResource(def)` | 注册资源 |
| `useRegisterSkill(def)` | 注册技能 |

</details>

<details>
<summary><h3>Vue 3 (<code>@page-mcp/vue3</code>)</h3></summary>

提供 Plugin + Composables。

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
  description: '获取当前表单数据',
  inputSchema: { type: 'object', properties: {} },
  execute: async () => ({ name: formData.name, email: formData.email })
});

const client = usePageMcpClient();
</script>
```

| Composable | 描述 |
|---|---|
| `usePageMcpHost()` | 获取 Host 实例 |
| `usePageMcpClient()` | 获取 Client 实例 |
| `usePageMcpBus()` | 获取 EventBus 实例 |
| `useRegisterTool(def)` | 注册工具 |
| `useRegisterResource(def)` | 注册资源 |
| `useRegisterSkill(def)` | 注册技能 |

</details>

<details>
<summary><h3>Vue 2 (<code>@page-mcp/vue2</code>)</h3></summary>

提供 Plugin + Mixin，通过 `this.$pageMcp` 访问。

```javascript
// main.js
import Vue from 'vue';
import { PageMcpPlugin } from '@page-mcp/vue2';
Vue.use(PageMcpPlugin, { name: 'my-app', version: '1.0' });
```

```javascript
// 组件
export default {
  pageMcpTools: [
    {
      name: 'getTableData',
      description: '获取表格当前数据',
      inputSchema: { type: 'object', properties: {} },
      execute: async function() { return this.tableData; }
    }
  ],
  pageMcpResources: [
    {
      uri: 'page://table/data',
      name: '表格数据',
      description: '当前表格展示的数据',
      handler: async () => ({ rows: store.state.tableData })
    }
  ]
};
```

| API | 描述 |
|---|---|
| `this.$pageMcp.host` | PageMcpHost 实例 |
| `this.$pageMcp.client` | PageMcpClient 实例 |
| `this.$pageMcp.bus` | EventBus 实例 |
| `pageMcpTools` 选项 | 组件创建时自动注册的工具数组 |
| `pageMcpResources` 选项 | 组件创建时自动注册的资源数组 |
| `pageMcpSkills` 选项 | 组件创建时自动注册的技能数组 |

</details>

## API 参考

### `EventBus`

通信总线，负责 Host 和 Client 之间的消息传递。

```typescript
const bus = new EventBus({ timeout: 10000 }); // RPC 超时时间，默认 10s

bus.on('rpc:request', (req) => { /* 日志 */ });
bus.on('rpc:response', (res) => { /* 日志 */ });
bus.destroy();
```

### `PageMcpHost`

页面侧的宿主，注册 Tools / Resources / Skills 并处理 AI 请求。

```typescript
const host = new PageMcpHost({ name: 'app', version: '1.0', bus });

host.registerTool(toolDef);       // 注册工具（WebMCP 对齐）
host.registerResource(resDef);    // 注册资源
host.registerSkill(skillDef);     // 注册技能

host.start();                     // 开始监听 RPC 请求
host.getBus();                    // 获取 EventBus 实例
host.destroy();                   // 停止监听并清理
```

### `PageMcpClient`

AI 侧的客户端，发现和调用页面能力。

```typescript
const client = new PageMcpClient({ bus, connectTimeout: 5000 });

await client.connect();
client.isConnected();
client.getHostInfo();

// Tools
await client.listTools();
await client.callTool(name, args);

// Resources
await client.listResources();
await client.readResource(uri);

// Prompts
await client.listPrompts();
await client.getPrompt(name, args);

client.disconnect();
```

### RPC 协议

| 方法 | 描述 | 参数 |
|---|---|---|
| `ping` | 心跳检测 | — |
| `getHostInfo` | 获取 Host 信息 | — |
| `tools/list` | 获取工具列表（RPC 方法） | `{ cursor?, limit? }` |
| `tools/call` | 调用工具（RPC 方法） | `{ name, arguments }` |
| `resources/list` | 获取资源列表（RPC 方法） | `{ cursor?, limit? }` |
| `resources/read` | 读取资源（RPC 方法） | `{ uri }` |
| `prompts/list` | 获取提示词模板列表（RPC 方法） | `{ cursor?, limit? }` |
| `prompts/get` | 解析提示词模板（RPC 方法） | `{ name, arguments }` |

## Demo

> 🌐 **在线预览：** [https://page-mcp.org](https://page-mcp.org)

项目包含一个完整的电商 Demo（TechMart），展示 SDK 的全部能力：

```bash
# 1. 安装依赖并构建
pnpm install
pnpm build

# 2. 启动本地服务器
npx serve .

# 3. 访问 http://localhost:3000/demo
```

Demo 特色：
- 🛍️ **电商店面** — 商品展示、购物车、订单历史
- 🔧 **MCP 调试控制台** — 查看已注册的工具/资源/技能和 RPC 通信记录
- ⚙️ **AI 设置面板** — 配置 API Key、Base URL、模型、主题
- 💬 **AI 聊天助手** — 嵌入式助手，通过 MCP 与商店交互

## 开发指南

### 环境要求

- Node.js >= 18
- pnpm >= 8

### 构建

```bash
pnpm install
pnpm build          # 构建所有包
pnpm build:core     # 仅构建核心包
pnpm build:chat     # 仅构建聊天组件
pnpm typecheck      # 类型检查
```

### 项目结构

```
page-mcp-sdk/
├── packages/
│   ├── core/               # @page-mcp/core
│   │   └── src/
│   │       ├── types.ts        # 共享类型（WebMCP 对齐）
│   │       ├── transport.ts    # EventBus 通信层
│   │       ├── host.ts         # PageMcpHost
│   │       ├── client.ts       # PageMcpClient
│   │       ├── polyfill.ts     # WebMCP Polyfill
│   │       ├── skill-runner.ts # 技能执行引擎
│   │       └── index.ts        # 统一导出
│   ├── chat/               # @page-mcp/chat
│   │   └── src/
│   │       ├── chat-engine.ts  # AI 聊天引擎（基于 fetch）
│   │       ├── chat-widget.ts  # Web 组件 UI
│   │       ├── styles.ts       # 主题样式
│   │       ├── markdown.ts     # Markdown 渲染器
│   │       └── types.ts        # 聊天类型定义
│   ├── react/              # @page-mcp/react
│   ├── vue3/               # @page-mcp/vue3
│   └── vue2/               # @page-mcp/vue2
├── demo/
│   └── index.html          # TechMart 电商 Demo
├── pnpm-workspace.yaml
└── package.json
```

## 设计原则

1. **WebMCP 对齐** — Tool API 与 W3C WebMCP 标准完全兼容
2. **超越标准** — Resources + Skills 提供 WebMCP 之外的增值能力
3. **自动检测** — 有浏览器原生 WebMCP 则用原生，无则 polyfill
4. **框架无关核心** — 核心逻辑不绑定任何框架
5. **零运行时依赖** — 核心 SDK 无第三方依赖
6. **可替换 Transport** — 通信层可拔插替换

## 参与贡献

欢迎贡献！请随时提交 Pull Request。

1. Fork 本仓库
2. 创建功能分支（`git checkout -b feature/amazing-feature`）
3. 提交更改（`git commit -m 'feat: add amazing feature'`）
4. 推送到分支（`git push origin feature/amazing-feature`）
5. 提交 Pull Request

## 许可证

[MIT](./LICENSE)
