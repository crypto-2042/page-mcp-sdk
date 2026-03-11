# @page-mcp/vue2

Vue 2 integration package for Page MCP. Use it when you want Page MCP to fit Vue 2 application structure through a plugin and mixin-based registration model.

## What This Package Does

- exposes a Vue 2 plugin
- exposes a mixin for automatic registration from component options
- exposes `this.$pageMcp` runtime access

## When To Use It

Use `@page-mcp/vue2` when:

- your app is built with Vue 2
- you want registration through component options or mixins
- you want a Vue 2-friendly wrapper around `@page-mcp/core`

Use `@page-mcp/core` directly outside Vue 2.

## Installation

```bash
npm install @page-mcp/core
npm install @page-mcp/protocol
npm install @page-mcp/vue2
```

## Minimal Example

```js
import Vue from 'vue';
import { PageMcpPlugin } from '@page-mcp/vue2';

Vue.use(PageMcpPlugin, { name: 'demo-app', version: '1.0.0' });
```

```js
export default {
  pageMcpTools: [
    {
      name: 'search_products',
      description: 'Search products by keyword',
      execute: async function(input) {
        return [{ keyword: String(input.keyword || '') }];
      },
    },
  ],
};
```

## Core Exports

- `PageMcpPlugin`
- `pageMcpMixin`
- runtime access through `this.$pageMcp`

`this.$pageMcp` exposes:

- `host`
- `client`
- `skills`
- `bus`

## Relationship To Other Packages

- `@page-mcp/core`
  - runtime implementation
- `@page-mcp/protocol`
  - protocol types for registration and metadata

Use this package for Vue 2 integration ergonomics, not as the low-level runtime.
