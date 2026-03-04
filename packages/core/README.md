# @page-mcp/core

Page MCP SDK 的核心包。提供 `PageMcpHost`、`PageMcpClient`、`EventBus` 和 `SkillRunner`。

## 安装

```bash
npm install @page-mcp/core
```

## 基本用法

```typescript
import { PageMcpHost, PageMcpClient, EventBus } from '@page-mcp/core';

const bus = new EventBus();

// Host：注册能力
const host = new PageMcpHost({ name: 'my-app', version: '1.0', bus });
host.registerTool({
  name: 'greet',
  description: '打招呼',
  parameters: { type: 'object', properties: { name: { type: 'string' } } },
  handler: async (args) => `Hello, ${args.name}!`
});
host.start();

// Client：发现并调用
const client = new PageMcpClient({ bus });
await client.connect();
const result = await client.callTool('greet', { name: 'World' });
// => "Hello, World!"
```

详细文档请参阅 [主 README](../../README.md)。
