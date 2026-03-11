# @page-mcp/protocol

Page MCP 的纯协议包。只在你需要共享 MCP / WebMCP / Page MCP 类型与常量，而不想引入运行时实现时使用。

## 这个包负责什么

- 导出共享协议类型
- 导出 MCP 原生方法常量
- 定义 Page MCP 的协议扩展面
- 不包含运行时代码

## 什么时候用它

以下场景使用 `@page-mcp/protocol`：

- 多个项目之间共享协议类型
- 围绕 Page MCP 构建适配层
- 只需要编译期协议契约，不需要 Host/Client/Transport

如果你需要真正运行的 host、client 或 transport，请使用 `@page-mcp/core`。

## 安装

```bash
npm install @page-mcp/protocol
```

## 最小示例

```ts
import type {
  AnthropicMcpTool,
  PageMcpToolDefinition,
  McpRequest,
} from '@page-mcp/protocol';

const tool: PageMcpToolDefinition = {
  name: 'sum',
  description: 'Sum two numbers',
  execute: async (input) => Number(input.a) + Number(input.b),
};

const request: McpRequest = {
  id: '1',
  method: 'tools/list',
};
```

## 核心导出

- `AnthropicMcp*`
  - 面向 MCP 的 tools、resources、prompts 与 JSON schema 类型
- `WebMcp*`
  - WebMCP 的 tool 执行相关类型
- `PageMcp*`
  - Page MCP 的协议扩展类型
- `MCP_METHODS`、`Mcp*`
  - MCP 原生请求/响应与方法常量

## 不包含什么

这个包不包含：

- `PageMcpHost`
- `PageMcpClient`
- transports
- DOM/resource 解析
- polyfill
- 浏览器运行时辅助逻辑

## 与其他包的关系

- `@page-mcp/core`
  - 运行时实现包
- `@page-mcp/webmcp-adapter`
  - 浏览器适配层
- 各框架包
  - 可能会消费或转导这些协议类型
