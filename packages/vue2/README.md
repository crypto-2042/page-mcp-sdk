# @page-mcp/vue2

Vue 2 adapter for the Page MCP SDK. Provides a Plugin and Mixin for easy integration.

> 🌐 **Live Preview:** [https://page-mcp.org](https://page-mcp.org)

## Installation

```bash
npm install @page-mcp/core @page-mcp/vue2
```

## Quick Start

### 1. Install Plugin

```javascript
// main.js
import Vue from 'vue';
import { PageMcpPlugin } from '@page-mcp/vue2';

Vue.use(PageMcpPlugin, { name: 'my-app', version: '1.0' });
```

### 2. Option A: Component Options (Recommended)

Declare tools, resources, and skills directly in component options. They are auto-registered on `created` and cleaned up on `beforeDestroy`.

```javascript
export default {
  pageMcpTools: [
    {
      name: 'getTableData',
      description: 'Get current table data',
      inputSchema: { type: 'object', properties: {} },
      execute: async function() { return this.tableData; }
    }
  ],

  pageMcpResources: [
    {
      uri: 'page://table/data',
      name: 'Table Data',
      description: 'Data displayed in the table',
      handler: async () => ({ rows: store.state.tableData })
    }
  ]
};
```

### 2. Option B: Use `this.$pageMcp` Directly

```javascript
export default {
  methods: {
    async init() {
      // Register a tool
      this.$pageMcp.host.registerTool({
        name: 'search',
        description: 'Search records',
        inputSchema: { type: 'object', properties: { q: { type: 'string' } } },
        execute: async (args) => this.doSearch(args.q)
      });

      // Discover tools from AI side
      const tools = await this.$pageMcp.client.listTools();
      console.log('Available tools:', tools);
    }
  }
};
```

## API

| API | Description |
|---|---|
| `this.$pageMcp.host` | `PageMcpHost` instance |
| `this.$pageMcp.client` | `PageMcpClient` instance |
| `this.$pageMcp.bus` | `EventBus` instance |
| `pageMcpTools` option | Array of tools auto-registered on component create |
| `pageMcpResources` option | Array of resources auto-registered on component create |
| `pageMcpSkills` option | Array of skills auto-registered on component create |

## How It Works

- `PageMcpPlugin` creates `EventBus`, `PageMcpHost`, and `PageMcpClient` instances and attaches them to `Vue.prototype.$pageMcp`.
- A global mixin reads `pageMcpTools`, `pageMcpResources`, and `pageMcpSkills` from component options and registers them during `created`, cleaning up in `beforeDestroy`.
- The Host is started automatically when the Plugin is installed.

For detailed documentation, see the [main README](../../README.md#vue-2-page-mcpvue2).

## License

MIT
