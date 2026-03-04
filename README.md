# Page MCP SDK

<p align="center">
  <strong>WebMCP Polyfill & Enhancement — 让网页自我解释，通过 MCP 协议将页面能力暴露给 AI</strong>
</p>

<p align="center">
  <a href="#与-webmcp-的关系">WebMCP 兼容</a> ·
  <a href="#快速开始">快速开始</a> ·
  <a href="#核心概念">核心概念</a> ·
  <a href="#api-参考">API 参考</a> ·
  <a href="#框架适配">框架适配</a> ·
  <a href="#demo">Demo</a>
</p>

---

## 与 WebMCP 的关系

[WebMCP](https://github.com/webmachinelearning/webmcp) 是 Google 和 Microsoft 联合提出的 W3C 标准，通过 `navigator.modelContext.registerTool()` 让页面暴露工具给 AI Agent。

**本 SDK 是 WebMCP 的 Polyfill + Enhancement：**

| 能力 | WebMCP 标准 | 本 SDK |
|------|-------------|--------|
| `registerTool()` | ✅ 浏览器原生（仅 Chrome Canary） | ✅ Polyfill，全浏览器可用 |
| `inputSchema` / `execute` | ✅ 标准字段 | ✅ 完全对齐 |
| `annotations.readOnlyHint` | ✅ 标准字段 | ✅ 完全对齐 |
| **Resources（数据暴露）** | ❌ 不支持 | ✅ `registerResource()` |
| **Skills（工作流编排）** | ❌ 不支持 | ✅ `registerSkill()` |
| **框架适配** | ❌ 仅原生 JS | ✅ React / Vue 3 / Vue 2 |
| **自动检测原生支持** | — | ✅ 有则用原生，无则 polyfill |

```typescript
import { installWebMcpPolyfill, isWebMcpSupported } from '@page-mcp/core';

// 自动检测：浏览器支持 WebMCP 则跳过，不支持则安装 polyfill
installWebMcpPolyfill(host);

// 现在标准 API 可用了（即使浏览器不原生支持）
navigator.modelContext.registerTool({
  name: 'search',
  description: 'Search products',
  inputSchema: { type: 'object', properties: { q: { type: 'string' } } },
  execute: async (input) => searchProducts(input.q),
});
```

## 为什么需要这个 SDK？

AI Agent 越来越需要理解和操作网页。传统的 DOM 分析既脆弱又低效。**Page MCP SDK** 让页面主动"自我解释"：

- 📦 **Tools** — 页面暴露可调用的操作（如"加入购物车"、"搜索"）— _对齐 WebMCP 标准_
- 📖 **Resources** — 页面暴露可读取的数据（如"购物车内容"、"用户偏好"）— _超越 WebMCP_
- 🚀 **Skills** — 多个工具组合的工作流（如"下单流程"）— _超越 WebMCP_

```
┌──────────────────────────────────────────┐
│               Web Page                    │
│                                          │
│  ┌────────────┐     ┌──────────────┐    │
│  │ Page App    │     │  AI Widget   │    │
│  └─────┬──────┘     └──────┬───────┘    │
│        │                    │            │
│  ┌─────▼──────┐     ┌─────▼───────┐    │
│  │ PageMcpHost │◄───►│PageMcpClient│    │
│  └─────┬──────┘     └─────┬───────┘    │
│        └──────┬────────────┘            │
│         ┌─────▼─────┐                   │
│         │  EventBus  │                   │
│         └───────────┘                   │
└──────────────────────────────────────────┘
```

## 包一览

| 包名 | 描述 | 大小 |
|------|------|------|
| [`@page-mcp/core`](./packages/core) | 核心 SDK（Host、Client、WebMCP Polyfill、SkillRunner） | ~13 KB |
| [`@page-mcp/react`](./packages/react) | React 适配器（Provider + Hooks） | ~3 KB |
| [`@page-mcp/vue3`](./packages/vue3) | Vue 3 适配器（Plugin + Composables） | ~3 KB |
| [`@page-mcp/vue2`](./packages/vue2) | Vue 2 适配器（Plugin + Mixin） | ~2 KB |

## 快速开始

### 安装

```bash
# 核心 SDK（必需）
npm install @page-mcp/core

# 选择一个框架适配器（可选）
npm install @page-mcp/react    # React
npm install @page-mcp/vue3     # Vue 3
npm install @page-mcp/vue2     # Vue 2
```

### 最简示例（纯 JS）

```typescript
import { PageMcpHost, PageMcpClient, EventBus, installWebMcpPolyfill } from '@page-mcp/core';

// 1. 创建共享通信总线
const bus = new EventBus();

// 2. 页面侧：注册工具（WebMCP 标准字段）
const host = new PageMcpHost({ name: 'my-app', version: '1.0', bus });

host.registerTool({
  name: 'search',
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

const result = await client.callTool('search', { keyword: '耳机' });
console.log('搜索结果:', result);
```

## 核心概念

### Tools（工具）— WebMCP 对齐

工具是 AI 可以调用的**单次操作**。API 与 WebMCP `ModelContextTool` 完全对齐：

| 字段 | WebMCP 标准 | 说明 |
|------|-------------|------|
| `name` | ✅ required | 唯一标识符 |
| `description` | ✅ required | 自然语言描述 |
| `inputSchema` | ✅ optional | JSON Schema 输入参数定义 |
| `execute` | ✅ required | 被 Agent 调用时的回调函数 |
| `annotations.readOnlyHint` | ✅ optional | 标记工具是否只读 |

```typescript
host.registerTool({
  name: 'addToCart',
  description: '将商品加入购物车',
  inputSchema: {
    type: 'object',
    properties: {
      productId: { type: 'string', description: '商品ID' },
      quantity: { type: 'number', description: '数量，默认为1' }
    },
    required: ['productId']
  },
  execute: async (input) => {
    const result = await cartService.add(input.productId as string, input.quantity as number ?? 1);
    return { success: true, cartSize: result.totalItems };
  }
});

// 只读工具标注
host.registerTool({
  name: 'getProductInfo',
  description: '获取商品详情',
  inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
  annotations: { readOnlyHint: true },
  execute: async (input) => products.find(p => p.id === input.id),
});
```

**AI 侧调用：**

```typescript
const tools = await client.listTools();
// => [{ name: 'addToCart', description: '...', inputSchema: {...}, annotations: {...} }]

const result = await client.callTool('addToCart', { productId: 'p001', quantity: 2 });
// => { success: true, cartSize: 3 }
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
    totalPrice: cartService.getTotalPrice()
  })
});
```

**AI 侧读取：**

```typescript
const resources = await client.listResources();
const cart = await client.readResource('page://cart/items');
// => { items: [...], totalPrice: 299.97 }
```

### Skills（技能/工作流）— 超越 WebMCP

Skills 是多个 Tools 按步骤编排的**工作流**。每个步骤可以引用已注册的 Tool，支持步骤间数据传递和条件校验。

> 💡 这是 Page MCP SDK 在 WebMCP 之上的增强能力。

```typescript
host.registerSkill({
  name: 'placeOrder',
  description: '完整下单流程：验证库存 → 计算价格 → 提交订单',
  inputSchema: {
    type: 'object',
    properties: {
      productId: { type: 'string' },
      quantity: { type: 'number' }
    },
    required: ['productId', 'quantity']
  },
  steps: [
    {
      name: 'checkStock',
      tool: 'getStock',
      input: (args) => ({ productId: args.productId }),
      validate: (result, args) => (result as any).stock >= Number(args.quantity),
      onFail: { error: '库存不足，无法下单' }
    },
    {
      name: 'calcPrice',
      tool: 'calculatePrice',
      input: (args) => ({ productId: args.productId, quantity: args.quantity })
    },
    {
      name: 'submit',
      tool: 'submitOrder',
      input: (args, prevResults) => ({
        productId: args.productId,
        quantity: args.quantity,
        totalPrice: (prevResults.calcPrice as any).total
      })
    }
  ]
});
```

**AI 侧执行：**

```typescript
const result = await client.executeSkill('placeOrder', { productId: 'p001', quantity: 3 });
// => {
//   success: true,
//   steps: {
//     checkStock: { productId: 'p001', stock: 15 },
//     calcPrice: { unitPrice: 89.99, total: 269.97 },
//     submit: { orderId: 'ORD-X7K2M9', status: 'confirmed' }
//   }
// }
```

## WebMCP Polyfill API

```typescript
import {
  installWebMcpPolyfill,
  isWebMcpSupported,
  toWebMcpTool,
  fromWebMcpTool,
} from '@page-mcp/core';

// 检测浏览器是否原生支持 WebMCP
isWebMcpSupported();  // => boolean

// 安装 polyfill（原生支持则跳过，除非 force: true）
installWebMcpPolyfill(host);
installWebMcpPolyfill(host, { force: true });  // 强制覆盖

// 转换工具定义格式
const webmcpTool = toWebMcpTool(ourToolDef);   // 我们 → WebMCP
const ourTool = fromWebMcpTool(webmcpTool);    // WebMCP → 我们
```

安装 polyfill 后，标准 WebMCP API 可用：

```typescript
navigator.modelContext.registerTool({
  name: 'myTool',
  description: 'A tool',
  execute: async (input) => ({ result: 'ok' }),
});

navigator.modelContext.unregisterTool('myTool');
navigator.modelContext.clearContext();
navigator.modelContext.provideContext({ tools: [...] });
```

## API 参考

### `EventBus`

通信总线，负责 Host 和 Client 之间的消息传递。

```typescript
const bus = new EventBus({ timeout: 10000 }); // RPC 超时时间，默认 10s

bus.on('rpc:request', (req) => { ... });   // 监听所有 RPC 请求（用于日志）
bus.on('rpc:response', (res) => { ... });  // 监听所有 RPC 响应（用于日志）
bus.destroy();                              // 清理所有监听器和挂起请求
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

await client.connect();                 // 连接到 Host
client.isConnected();                   // 是否已连接
client.getHostInfo();                   // 获取 Host 信息

// Tools
await client.listTools();               // 获取工具列表
await client.callTool(name, args);      // 调用工具

// Resources
await client.listResources();           // 获取资源列表
await client.readResource(uri);         // 读取资源

// Skills
await client.listSkills();              // 获取技能列表
await client.executeSkill(name, args);  // 执行技能

client.disconnect();                    // 断开连接
```

### RPC 协议

| 方法 | 描述 | 参数 |
|------|------|------|
| `ping` | 心跳检测 | 无 |
| `getHostInfo` | 获取 Host 信息 | 无 |
| `listTools` | 获取工具列表 | 无 |
| `callTool` | 调用工具 | `{ name, args }` |
| `listResources` | 获取资源列表 | 无 |
| `readResource` | 读取资源 | `{ uri }` |
| `listSkills` | 获取技能列表 | 无 |
| `executeSkill` | 执行技能 | `{ name, args }` |

## 框架适配

### React (`@page-mcp/react`)

提供 Provider 组件 + Hooks，符合 React 最佳实践。

**设置 Provider：**

```tsx
import { PageMcpProvider } from '@page-mcp/react';

function App() {
  return (
    <PageMcpProvider name="my-app" version="1.0">
      <ProductPage />
      <AIAssistant />
    </PageMcpProvider>
  );
}
```

**注册工具：**

```tsx
import { useRegisterTool, useRegisterResource } from '@page-mcp/react';

function ProductPage() {
  useRegisterTool({
    name: 'searchProducts',
    description: '搜索商品列表',
    inputSchema: {
      type: 'object',
      properties: { keyword: { type: 'string' } },
      required: ['keyword']
    },
    execute: async (input) => {
      return products.filter(p => p.name.includes(input.keyword as string));
    }
  });

  useRegisterResource({
    uri: 'page://products/list',
    name: '商品列表',
    description: '当前页面展示的所有商品',
    handler: async () => ({ products })
  });

  return <div>{/* 页面 UI */}</div>;
}
```

#### React Hooks API

| Hook | 描述 |
|------|------|
| `usePageMcpHost()` | 获取 Host 实例 |
| `usePageMcpClient()` | 获取 Client 实例 |
| `usePageMcpBus()` | 获取 EventBus 实例 |
| `useRegisterTool(def)` | 注册工具，组件卸载时自动清理 |
| `useRegisterResource(def)` | 注册资源 |
| `useRegisterSkill(def)` | 注册技能 |

---

### Vue 3 (`@page-mcp/vue3`)

提供 Plugin + Provider 组件 + Composables。

**全局 Plugin（推荐）：**

```typescript
import { createApp } from 'vue';
import { PageMcpPlugin } from '@page-mcp/vue3';

const app = createApp(App);
app.use(PageMcpPlugin, { name: 'my-app', version: '1.0' });
app.mount('#app');
```

**在组件中使用：**

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

#### Vue 3 Composables API

| Composable | 描述 |
|------------|------|
| `usePageMcpHost()` | 获取 Host 实例 |
| `usePageMcpClient()` | 获取 Client 实例 |
| `usePageMcpBus()` | 获取 EventBus 实例 |
| `useRegisterTool(def)` | 注册工具 |
| `useRegisterResource(def)` | 注册资源 |
| `useRegisterSkill(def)` | 注册技能 |

---

### Vue 2 (`@page-mcp/vue2`)

提供 Plugin + Mixin，通过 `this.$pageMcp` 访问。

**安装 Plugin：**

```javascript
import Vue from 'vue';
import { PageMcpPlugin } from '@page-mcp/vue2';

Vue.use(PageMcpPlugin, { name: 'my-app', version: '1.0' });
```

**使用组件选项自动注册（推荐）：**

```javascript
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

#### Vue 2 API

| API | 描述 |
|-----|------|
| `this.$pageMcp.host` | PageMcpHost 实例 |
| `this.$pageMcp.client` | PageMcpClient 实例 |
| `this.$pageMcp.bus` | EventBus 实例 |
| `pageMcpTools` 选项 | 组件创建时自动注册的工具数组 |
| `pageMcpResources` 选项 | 组件创建时自动注册的资源数组 |
| `pageMcpSkills` 选项 | 组件创建时自动注册的技能数组 |

---

## Demo

```bash
# 1. 构建核心包
cd page-mcp-sdk
pnpm install
pnpm build:core

# 2. 启动本地服务
npx serve .

# 3. 访问 http://localhost:3000/demo
```

Demo 页面包含：
- **左侧面板**：展示已注册的 Tools、Resources、Skills
- **右侧面板**：AI Client 操作区，可连接、发现、调用
- **RPC Console**：实时显示所有请求/响应消息
- **WebMCP Polyfill**：自动安装 `navigator.modelContext`

## 开发指南

### 环境要求

- Node.js >= 18
- pnpm >= 8

### 构建

```bash
pnpm install
pnpm build         # 构建所有包
pnpm build:core    # 仅构建核心包
pnpm typecheck     # 类型检查
```

### 项目结构

```
page-mcp-sdk/
├── packages/
│   ├── core/                # @page-mcp/core
│   │   ├── src/
│   │   │   ├── types.ts         # 共享类型（WebMCP 对齐）
│   │   │   ├── transport.ts     # EventBus 通信层
│   │   │   ├── host.ts          # PageMcpHost
│   │   │   ├── client.ts        # PageMcpClient
│   │   │   ├── polyfill.ts      # WebMCP Polyfill ← 新增
│   │   │   ├── skill-runner.ts  # 技能执行引擎
│   │   │   └── index.ts         # 统一导出
│   │   └── package.json
│   ├── react/               # @page-mcp/react
│   ├── vue3/                # @page-mcp/vue3
│   └── vue2/                # @page-mcp/vue2
├── demo/
│   └── index.html           # 交互式演示
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

## License

MIT
