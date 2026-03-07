# WebMCP Compatibility Evidence

## Covered behaviors

- Polyfill install and support detection moved to `@page-mcp/webmcp-adapter`.
- `registerTool` lifecycle supports duplicate checks and host registration.
- `unregisterTool` and `clearContext` remove bridged tools from host registry.
- `execute(input, client)` passes a client helper exposing `requestUserInteraction`.

## Tests

- `packages/core/test/tools-contract.test.ts`
- `packages/core/test/tool-lifecycle.test.ts`

## Notes

`requestUserInteraction` currently returns a typed stub (`not_implemented`) and is ready for host-specific wiring.
