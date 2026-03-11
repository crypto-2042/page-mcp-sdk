# @page-mcp/vue2

Page MCP 的 Vue 2 集成包。需要通过 plugin 和 mixin 这种更符合 Vue 2 的方式接入 Page MCP 时，使用这个包。

## 这个包负责什么

- 提供 Vue 2 plugin
- 提供基于组件选项自动注册的 mixin
- 通过 `this.$pageMcp` 暴露运行时访问入口

## 什么时候用它

以下场景使用 `@page-mcp/vue2`：

- 你的应用基于 Vue 2
- 希望通过组件选项或 mixin 来注册能力
- 希望用 Vue 2 习惯的方式包裹 `@page-mcp/core`

如果不在 Vue 2 中使用，直接用 `@page-mcp/core` 即可。

## 安装

```bash
npm install @page-mcp/core
npm install @page-mcp/protocol
npm install @page-mcp/vue2
```

## 最小示例

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

## 核心导出

- `PageMcpPlugin`
- `pageMcpMixin`
- 通过 `this.$pageMcp` 访问运行时对象

`this.$pageMcp` 提供：

- `host`
- `client`
- `skills`
- `bus`

## 与其他包的关系

- `@page-mcp/core`
  - 运行时实现
- `@page-mcp/protocol`
  - 注册定义和元数据所需的协议类型

这个包负责 Vue 2 的接入体验，不是底层运行时本身。
