# MCP Compatibility Evidence

## Method coverage

- `tools/list` with pagination (`cursor`, `limit`, `nextCursor`)
- `tools/call` with `arguments`
- `resources/list`
- `resources/read` with `{ contents: [...] }`
- `prompts/list`
- `prompts/get`
- `notifications/tools|resources|prompts/list_changed`

## Tests

- `packages/core/test/mcp-methods.test.ts`
- `packages/core/test/resources-contract.test.ts`
- `packages/core/test/prompts-contract.test.ts`
- `packages/core/test/capabilities-and-pagination.test.ts`

## Extension boundary

Skills are no longer part of the default client API surface and are exported via `Extensions` namespace.
