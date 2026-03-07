# Page MCP SDK v1 -> v2 Migration

## Breaking changes

- WebMCP polyfill APIs moved from `@page-mcp/core` to `@page-mcp/webmcp-adapter`.
- MCP method routing is now standardized around:
  - `tools/list`, `tools/call`
  - `resources/list`, `resources/read`
  - `prompts/list`, `prompts/get`
- Prompt model changed from card-style `{ title, icon, prompt }` to template-style `{ name, description, arguments, handler }`.
- Resource reads are normalized to `{ contents: [...] }`.
- Skills are now extension-scoped (`Extensions`) and not in the default client API surface.
- Legacy `SkillRunner` orchestration API has been removed in favor of `Extensions.createSkillsClient(...)` + `extensions/skills/*`.

## API mapping

- `client.connect()` now prefers MCP `initialize` and falls back to legacy `getHostInfo`.
- `client.callTool(name, args)` now sends `tools/call` with `arguments` payload.
- `client.listResources()/readResource()` now uses `resources/list` and `resources/read`.
- `client.listPrompts()/getPrompt()` now uses `prompts/list` and `prompts/get`.
- `installWebMcpPolyfill()` import path:
  - v1: `@page-mcp/core`
  - v2: `@page-mcp/webmcp-adapter`

## Recommended rollout

1. Upgrade to v2 and keep default compatibility mode (`strictProtocol: false`).
2. Migrate callers to standard methods: `initialize`, `tools/*`, `resources/*`, `prompts/*`.
3. Enable `strictProtocol: true` to reject legacy RPC calls.

## Example updates

```ts
import { PageMcpHost, EventBus } from '@page-mcp/core';
import { installWebMcpPolyfill } from '@page-mcp/webmcp-adapter';
```
