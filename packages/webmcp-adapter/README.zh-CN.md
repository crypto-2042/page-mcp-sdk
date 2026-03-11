# @page-mcp/webmcp-adapter

浏览器侧的 WebMCP 适配包。需要把浏览器风格的 WebMCP 能力注册桥接到 `PageMcpHost`，或者提供 `navigator.modelContext` 风格 polyfill 时，使用这个包。

## 这个包负责什么

- 提供 `installWebMcpPolyfill()`
- 通过 `isWebMcpSupported()` 检测浏览器是否已有原生支持
- 在浏览器侧 WebMCP tool 对象和 Page MCP tool definition 之间做转换

## 什么时候用它

以下场景使用 `@page-mcp/webmcp-adapter`：

- 你希望在浏览器中使用 `navigator.modelContext` 风格的注册方式
- 你需要把浏览器侧 WebMCP tools 桥接到 `PageMcpHost`
- 你需要在 `@page-mcp/core` 之上加一层兼容适配

不要把它当成主运行时包。真正的 host 行为仍然来自 `@page-mcp/core`。

## 安装

```bash
npm install @page-mcp/core
npm install @page-mcp/protocol
npm install @page-mcp/webmcp-adapter
```

## 最小示例

```ts
import { PageMcpHost } from '@page-mcp/core';
import { installWebMcpPolyfill } from '@page-mcp/webmcp-adapter';

const host = new PageMcpHost({
  name: 'demo-app',
  version: '1.0.0',
});

host.start();
installWebMcpPolyfill(host);
```

安装后，浏览器侧代码就可以通过 WebMCP 风格接口注册 tools。

## 核心导出

- `installWebMcpPolyfill()`
- `isWebMcpSupported()`
- `toWebMcpTool()`
- `fromWebMcpTool()`

## 与其他包的关系

- `@page-mcp/core`
  - 提供 `PageMcpHost`
- `@page-mcp/protocol`
  - 提供共享协议类型与常量

真正的运行时执行逻辑在 `core` 中；这个包只负责浏览器适配层。
