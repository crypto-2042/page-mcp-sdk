# @page-mcp/react

Page MCP 的 React 集成包。需要通过 Provider 和 hooks 在 React 中自然接入 `PageMcpHost` / `PageMcpClient` 时，使用这个包。

## 这个包负责什么

- 用 React Provider 承载 Page MCP 运行时对象
- 提供获取 host/client 的 hooks
- 提供注册 tools、resources、prompts、skills 的 hooks

## 什么时候用它

以下场景使用 `@page-mcp/react`：

- 你的应用基于 React
- 希望 Page MCP 生命周期跟随 React 组件生命周期
- 希望通过 hooks 注册能力，而不是自己手动接线

如果不在 React 中运行，直接使用 `@page-mcp/core` 即可。

## 安装

```bash
npm install @page-mcp/core
npm install @page-mcp/protocol
npm install @page-mcp/react
```

## 最小示例

```tsx
import { PageMcpProvider, useRegisterTool, usePageMcpClient } from '@page-mcp/react';

function ProductPage() {
  useRegisterTool({
    name: 'search_products',
    description: 'Search products by keyword',
    execute: async (input) => [{ keyword: String(input.keyword ?? '') }],
  });

  const client = usePageMcpClient();

  return <button onClick={() => client.toolsList()}>Inspect tools</button>;
}

export function App() {
  return (
    <PageMcpProvider name="demo-app" version="1.0.0">
      <ProductPage />
    </PageMcpProvider>
  );
}
```

## 核心导出

- `PageMcpProvider`
- `usePageMcpHost()`
- `usePageMcpClient()`
- `usePageMcpBus()`
- `useRegisterTool()`
- `useRegisterResource()`
- `useRegisterPrompt()`
- `useRegisterSkill()`
- `usePageMcpSkills()`

## 与其他包的关系

- `@page-mcp/core`
  - 运行时实现
- `@page-mcp/protocol`
  - 注册定义和元数据所需的协议类型

这个包负责 React 的集成体验，不替代 `core` 本身。
