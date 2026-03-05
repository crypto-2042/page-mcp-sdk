# @page-mcp/chat

Embeddable AI Chat Widget with OpenAI-compatible API integration and automatic Page MCP tool discovery.

## Features

- 🎨 Beautiful dark/light/auto theme with glassmorphism design
- 📱 Responsive — works on desktop and mobile
- 🔧 Auto-discovers MCP tools registered via `@page-mcp/core`
- 🤖 OpenAI function-calling for tool execution
- 💬 Streaming-ready chat UI with Markdown support
- ⚙️ Fully configurable via JavaScript API

## Quick Start

### Script Tag (IIFE)

```html
<script src="@page-mcp/core/dist/index.global.js"></script>
<script src="@page-mcp/chat/dist/index.global.js"></script>
<script>
  PageMcpChat.init({
    openai: { apiKey: 'sk-xxx', model: 'gpt-4o' },
    theme: 'dark',
    position: 'bottom-right',
  });
</script>
```

### ES Module

```js
import { init } from '@page-mcp/chat';

init({
  openai: { apiKey: 'sk-xxx', model: 'gpt-4o' },
  theme: 'dark',
  position: 'bottom-right',
});
```

## Configuration

| Option          | Type     | Default              | Description                          |
| --------------- | -------- | -------------------- | ------------------------------------ |
| `openai.apiKey` | string   | —                    | OpenAI API key                       |
| `openai.baseURL`| string   | `https://api.openai.com/v1` | API endpoint (supports any OpenAI-compatible API) |
| `openai.model`  | string   | `gpt-4o`             | Model name                           |
| `theme`         | string   | `dark`               | `dark`, `light`, or `auto`           |
| `position`      | string   | `bottom-right`       | `bottom-right`, `bottom-left`, etc.  |
| `title`         | string   | `AI Assistant`       | Chat panel title                     |
| `accentColor`   | string   | `#6C5CE7`            | Brand accent color                   |
| `bus`           | EventBus | auto-detected        | MCP EventBus instance                |

## MCP Integration

When used alongside `@page-mcp/core`, the widget automatically discovers registered tools and makes them available to the AI via function calling. No additional configuration needed.

## License

MIT
