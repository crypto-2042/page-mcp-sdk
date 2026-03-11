# @page-mcp/vue3

Vue 3 integration package for Page MCP. Use it when you want Vue-native setup around Page MCP through a plugin, provider, and composables.

## What This Package Does

- exposes a Vue 3 plugin for app-wide installation
- exposes a provider component for subtree-scoped usage
- exposes composables for host/client access and registration

## When To Use It

Use `@page-mcp/vue3` when:

- your app is built with Vue 3
- you want plugin or provider-style integration
- you want registration through composables instead of manual host wiring

Use `@page-mcp/core` directly outside Vue.

## Installation

```bash
npm install @page-mcp/core
npm install @page-mcp/protocol
npm install @page-mcp/vue3
```

## Minimal Example

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

## Core Exports

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

## Relationship To Other Packages

- `@page-mcp/core`
  - runtime implementation
- `@page-mcp/protocol`
  - protocol types for registration and metadata

Use this package for Vue 3 ergonomics, not as a standalone runtime.
