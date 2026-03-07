# @page-mcp/vue3

Vue 3 adapter for the Page MCP SDK. Provides a Plugin, Provider component, and Composables.

> 🌐 **Live Preview:** [https://page-mcp.org](https://page-mcp.org)

## Installation

```bash
npm install @page-mcp/core @page-mcp/vue3
```

## Quick Start

### Option 1: Global Plugin (Recommended)

```typescript
// main.ts
import { createApp } from 'vue';
import { PageMcpPlugin } from '@page-mcp/vue3';
import App from './App.vue';

const app = createApp(App);
app.use(PageMcpPlugin, { name: 'my-app', version: '1.0' });
app.mount('#app');
```

### Option 2: Local Provider

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

### Register Tools in Components

```vue
<script setup lang="ts">
import { useRegisterTool, useRegisterResource, usePageMcpClient } from '@page-mcp/vue3';

useRegisterTool({
  name: 'getFormData',
  description: 'Get current form data',
  inputSchema: { type: 'object', properties: {} },
  execute: async () => ({ name: formData.name, email: formData.email })
});

useRegisterResource({
  uri: 'page://form/data',
  name: 'Form Data',
  description: 'Current form field values',
  handler: async () => ({ ...formData })
});

const client = usePageMcpClient();
</script>
```

## API

| Composable | Description |
|---|---|
| `usePageMcpHost()` | Get the `PageMcpHost` instance |
| `usePageMcpClient()` | Get the `PageMcpClient` instance |
| `usePageMcpSkills()` | Get the Extensions skills client |
| `usePageMcpBus()` | Get the `EventBus` instance |
| `useRegisterTool(def)` | Register a tool (auto-cleanup on unmount) |
| `useRegisterResource(def)` | Register a resource (auto-cleanup on unmount) |
| `useRegisterSkill(def)` | Register a skill (auto-cleanup on unmount) |

## How It Works

- `PageMcpPlugin` / `PageMcpProvider` creates `EventBus`, `PageMcpHost`, and `PageMcpClient` instances and provides them via Vue's `provide/inject`.
- Composables (`useRegisterTool`, etc.) register capabilities on mount and automatically clean up via `onUnmounted`.
- The Host is started automatically when the Plugin is installed or Provider is mounted.

For detailed documentation, see the [main README](../../README.md#vue-3-page-mcpvue3).

## License

MIT
