# @page-mcp/react

Page MCP SDK 的 React 适配器。提供 Provider 组件和 Hooks。

## 安装

```bash
npm install @page-mcp/core @page-mcp/react
```

## 使用

### 1. 包裹 Provider

```tsx
import { PageMcpProvider } from '@page-mcp/react';

function App() {
  return (
    <PageMcpProvider name="my-app" version="1.0">
      <MyPage />
    </PageMcpProvider>
  );
}
```

### 2. 注册工具

```tsx
import { useRegisterTool } from '@page-mcp/react';

function MyPage() {
  useRegisterTool({
    name: 'getData',
    description: '获取页面数据',
    parameters: { type: 'object', properties: {} },
    handler: async () => ({ data: 'hello' })
  });

  return <div>My Page</div>;
}
```

### 3. AI 组件调用

```tsx
import { usePageMcpClient } from '@page-mcp/react';

function AIWidget() {
  const client = usePageMcpClient();

  const handleClick = async () => {
    const tools = await client.listTools();
    const result = await client.callTool('getData', {});
    console.log(result);
  };

  return <button onClick={handleClick}>Ask AI</button>;
}
```

## API

| Hook | 描述 |
|------|------|
| `usePageMcpHost()` | 获取 Host 实例 |
| `usePageMcpClient()` | 获取 Client 实例 |
| `usePageMcpBus()` | 获取 EventBus |
| `useRegisterTool(def)` | 注册工具 |
| `useRegisterResource(def)` | 注册资源 |
| `useRegisterSkill(def)` | 注册技能 |

详细文档请参阅 [主 README](../../README.md#react-page-mcpreact)。
