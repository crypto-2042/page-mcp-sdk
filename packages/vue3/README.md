# @page-mcp/vue3

Page MCP SDK 的 Vue 3 适配器。提供 Plugin、Provider 组件和 Composables。

## 安装

```bash
npm install @page-mcp/core @page-mcp/vue3
```

## 使用

### 方式一：全局 Plugin（推荐）

```typescript
// main.ts
import { createApp } from 'vue';
import { PageMcpPlugin } from '@page-mcp/vue3';
import App from './App.vue';

const app = createApp(App);
app.use(PageMcpPlugin, { name: 'my-app', version: '1.0' });
app.mount('#app');
```

### 方式二：局部 Provider

```vue
<template>
  <PageMcpProvider name="my-app" version="1.0">
    <MyComponent />
  </PageMcpProvider>
</template>

<script setup>
import { PageMcpProvider } from '@page-mcp/vue3';
</script>
```

### 在组件中使用

```vue
<script setup lang="ts">
import { useRegisterTool, usePageMcpClient } from '@page-mcp/vue3';

useRegisterTool({
  name: 'getFormData',
  description: '获取表单数据',
  parameters: { type: 'object', properties: {} },
  handler: async () => ({ name: 'test' })
});

const client = usePageMcpClient();
</script>
```

## API

| Composable | 描述 |
|------------|------|
| `usePageMcpHost()` | 获取 Host 实例 |
| `usePageMcpClient()` | 获取 Client 实例 |
| `usePageMcpBus()` | 获取 EventBus |
| `useRegisterTool(def)` | 注册工具 |
| `useRegisterResource(def)` | 注册资源 |
| `useRegisterSkill(def)` | 注册技能 |

详细文档请参阅 [主 README](../../README.md#vue-3-page-mcpvue3)。
