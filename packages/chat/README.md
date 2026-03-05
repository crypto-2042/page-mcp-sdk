# @page-mcp/chat

Embeddable AI Chat Widget with OpenAI-compatible API integration and automatic Page MCP tool discovery.

> 🌐 **Live Preview:** [https://page-mcp.org](https://page-mcp.org)

## Features

- 🎨 Beautiful dark/light/auto theme with glassmorphism design
- 📱 Responsive — works on desktop and mobile
- 🔧 Auto-discovers MCP tools registered via `@page-mcp/core`
- 🤖 OpenAI function-calling for tool execution
- 💬 Chat UI with Markdown support (tables, code blocks, lists, headings)
- ⚡ Prompt shortcut cards for quick interactions
- 🗑️ Clear chat button to reset conversation
- ⚙️ Fully configurable via JavaScript API
- 📦 Zero dependencies — pure vanilla JS Web Component

## Installation

```bash
npm install @page-mcp/core @page-mcp/chat
```

## Quick Start

### Script Tag (IIFE)

```html
<script src="@page-mcp/core/dist/index.global.js"></script>
<script src="@page-mcp/chat/dist/index.global.js"></script>
<script>
  const bus = new PageMcpCore.EventBus();
  const host = new PageMcpCore.PageMcpHost({ name: 'my-app', version: '1.0', bus });
  host.registerTool({ /* ... */ });
  host.start();

  PageMcpChat.init({
    bus,
    openai: { apiKey: 'sk-xxx', model: 'gpt-5.2' },
    theme: 'dark',
    position: 'bottom-right',
  });
</script>
```

### ES Module

```typescript
import { EventBus, PageMcpHost } from '@page-mcp/core';
import { init } from '@page-mcp/chat';

const bus = new EventBus();
const host = new PageMcpHost({ name: 'my-app', version: '1.0', bus });
host.start();

const widget = init({
  bus,
  openai: { apiKey: 'sk-xxx', model: 'gpt-5.2' },
  theme: 'dark',
  position: 'bottom-right',
  title: 'AI Assistant',
  welcomeMessage: 'Hi! How can I help you?',
});

// Programmatic control
widget.open();
widget.close();
widget.destroy();
```

## Configuration

| Option | Type | Default | Description |
|---|---|---|---|
| `bus` | `EventBus` | auto-detected | MCP EventBus instance |
| `openai.apiKey` | `string` | — | OpenAI API key |
| `openai.baseURL` | `string` | `https://api.openai.com/v1` | API endpoint (supports any OpenAI-compatible API) |
| `openai.model` | `string` | `gpt-5.2` | Model name |
| `theme` | `string` | `dark` | `dark`, `light`, or `auto` |
| `position` | `string` | `bottom-right` | `bottom-right` or `bottom-left` |
| `title` | `string` | `AI Assistant` | Chat panel title |
| `accentColor` | `string` | `#6C5CE7` | Brand accent color |
| `welcomeMessage` | `string` | — | Initial welcome message |
| `prompts` | `PromptInfo[]` | auto-discovered | Prompt shortcut cards |

## MCP Integration

When used alongside `@page-mcp/core`, the widget automatically discovers registered tools and makes them available to the AI via OpenAI function calling. No additional configuration needed — just share the same `EventBus` instance.

## Markdown Support

The chat widget renders rich Markdown content from AI responses:

- **Tables** — Full `<table>` rendering with styled headers and alternating rows
- **Code blocks** — Fenced code blocks with syntax-aware styling
- **Inline code** — Backtick-wrapped inline code
- **Bold / Italic** — Standard markdown emphasis
- **Links** — Clickable links that open in new tabs
- **Headings** — H2, H3, H4 support
- **Lists** — Unordered lists

## License

MIT
