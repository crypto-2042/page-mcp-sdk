# @page-mcp/vue3

Page MCP 的 Vue 3 集成包。需要通过 plugin、provider 和 composables 在 Vue 3 中自然接入 Page MCP 时，使用这个包。

## 这个包负责什么

- 提供 Vue 3 plugin，适合全局安装
- 提供 provider 组件，适合局部子树使用
- 提供 host/client 访问与能力注册用的 composables

## 什么时候用它

以下场景使用 `@page-mcp/vue3`：

- 你的应用基于 Vue 3
- 希望使用 plugin 或 provider 的接入方式
- 希望通过 composables 注册能力，而不是手动维护 host

如果不在 Vue 中使用，直接用 `@page-mcp/core` 即可。

## 安装

```bash
npm install @page-mcp/core
npm install @page-mcp/protocol
npm install @page-mcp/vue3
```

## 最小示例

```ts
import { createApp } from 'vue';
import { PageMcpPlugin } from '@page-mcp/vue3';
import App from './App.vue';

const app = createApp(App);
app.use(PageMcpPlugin, { name: 'demo-app', version: '1.0.0' });
app.mount('#app');
```

```vue
<script setup lang="ts">
import { useRegisterTool } from '@page-mcp/vue3';

useRegisterTool({
  name: 'search_products',
  description: 'Search products by keyword',
  execute: async (input) => [{ keyword: String(input.keyword ?? '') }],
});
</script>
```

## 核心导出

- `PageMcpPlugin`
- `PageMcpProvider`
- `usePageMcpHost()`
- `usePageMcpClient()`
- `usePageMcpBus()`
- `usePageMcpSkills()`
- `useRegisterTool()`
- `useRegisterResource()`
- `useRegisterPrompt()`
- `useRegisterSkill()`

## 与其他包的关系

- `@page-mcp/core`
  - 运行时实现
- `@page-mcp/protocol`
  - 注册定义和元数据所需的协议类型

这个包负责 Vue 3 的集成体验，不是单独的运行时实现包。
