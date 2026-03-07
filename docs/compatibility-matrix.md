# Compatibility Matrix

## WebMCP

- `navigator.modelContext.registerTool`: supported (adapter package)
- `navigator.modelContext.unregisterTool`: supported
- `execute(input, client)` second parameter: supported (`requestUserInteraction` stubbed contract)
- `clearContext` lifecycle behavior: host-synchronized
- secure-context behavior: adapter skips installation on insecure context unless `force: true`

## MCP Server Methods

- `tools/list`: supported (cursor + limit + nextCursor)
- `tools/call`: supported (`arguments` payload)
- `resources/list`: supported
- `resources/read`: supported (`contents[]`)
- `prompts/list`: supported
- `prompts/get`: supported
- `notifications/*/list_changed`: supported for tools/resources/prompts
- `initialize`: supported
- legacy methods: supported in compatibility mode, rejected when `strictProtocol: true`

## Non-standard extensions

- Skills are extension-scoped under `Extensions` and not part of default MCP surface.
- Skills methods:
  - `extensions/skills/list`
  - `extensions/skills/get`
  - `extensions/skills/execute`
- Skills payload supports `skillMd` and optional `scriptJs` registration.
- Inline `scriptJs` execution is disabled by default and requires explicit host opt-in.
