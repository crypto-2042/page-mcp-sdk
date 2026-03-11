# Protocol Package Split

`@page-mcp/protocol` is now the protocol-only package for:

- Anthropic MCP types
- WebMCP types
- Page MCP protocol extension types
- MCP method constants

`@page-mcp/core` now focuses on runtime implementation:

- `PageMcpHost`
- `PageMcpClient`
- transports
- resource URI resolution
- skills runtime support

## Import Changes

Old:

```ts
import type { AnthropicMcpTool, PageMcpToolDefinition } from '@page-mcp/core';
```

New:

```ts
import type { AnthropicMcpTool, PageMcpToolDefinition } from '@page-mcp/protocol';
```

Runtime imports stay in `@page-mcp/core`:

```ts
import { PageMcpHost, PageMcpClient } from '@page-mcp/core';
```

This is a breaking package-boundary change and is intended for the new major version line.
