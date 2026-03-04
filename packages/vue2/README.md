# @page-mcp/vue2

Page MCP SDK 的 Vue 2 适配器。提供 Plugin 和 Mixin。

## 安装

```bash
npm install @page-mcp/core @page-mcp/vue2
```

## 使用

### 安装 Plugin

```javascript
// main.js
import Vue from 'vue';
import { PageMcpPlugin } from '@page-mcp/vue2';

Vue.use(PageMcpPlugin, { name: 'my-app', version: '1.0' });
```

### 方式一：通过 `this.$pageMcp`

```javascript
export default {
  methods: {
    async init() {
      // 注册工具
      this.$pageMcp.host.registerTool({
        name: 'search',
        description: '搜索',
        parameters: { type: 'object', properties: { q: { type: 'string' } } },
        handler: async (args) => this.doSearch(args.q)
      });

      // 获取工具列表
      const tools = await this.$pageMcp.client.listTools();
    }
  }
};
```

### 方式二：组件选项自动注册（推荐）

```javascript
export default {
  pageMcpTools: [
    {
      name: 'getTableData',
      description: '获取表格数据',
      parameters: { type: 'object', properties: {} },
      handler: async () => store.state.tableData
    }
  ],

  pageMcpResources: [
    {
      uri: 'page://table/data',
      name: '表格数据',
      description: '当前展示的表格数据',
      handler: async () => ({ rows: store.state.tableData })
    }
  ]
};
```

## API

| API | 描述 |
|-----|------|
| `this.$pageMcp.host` | PageMcpHost 实例 |
| `this.$pageMcp.client` | PageMcpClient 实例 |
| `this.$pageMcp.bus` | EventBus 实例 |
| `pageMcpTools` 选项 | 自动注册的工具数组 |
| `pageMcpResources` 选项 | 自动注册的资源数组 |
| `pageMcpSkills` 选项 | 自动注册的技能数组 |

详细文档请参阅 [主 README](../../README.md#vue-2-page-mcpvue2)。
