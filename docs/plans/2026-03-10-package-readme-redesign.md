# Package README Redesign

## Goal

Rewrite the package-level READMEs so each package describes its current primary responsibility clearly, with `@page-mcp/core` emphasizing real usage patterns and all packages providing both English and Chinese README files.

## Design Summary

The package READMEs should stop trying to be uniform API dumps. Instead, each package should explain:

- what problem the package solves
- when to use it
- when not to use it
- how it relates to the rest of the workspace

The documentation style should be:

- balanced rather than exhaustive
- package-role-first rather than changelog-first
- concise enough to stay maintainable

## Package-Specific Direction

### `@page-mcp/core`

This README should be usage-first.

Primary focus:

- how to instantiate `PageMcpHost`
- how to register tools, resources, prompts, and skills
- how to connect `PageMcpClient`
- how to choose transports
- how `@page-mcp/protocol` and `@page-mcp/webmcp-adapter` relate to `core`

Recommended structure:

1. What `core` is
2. When to use it
3. Installation
4. Quick start
5. Common patterns
6. Transport choices
7. Relationship to other packages
8. Notes / migration

### `@page-mcp/protocol`

This README should be boundary-first.

Primary focus:

- protocol-only package
- contains types/constants only
- no runtime behavior
- intended for shared imports across projects

### `@page-mcp/webmcp-adapter`

This README should explain browser adapter scope.

Primary focus:

- polyfilling or bridging WebMCP browser-facing tool registration
- when to use it alongside `core`
- when not to use it

### `@page-mcp/chat`

This README should explain product usage.

Primary focus:

- embeddable chat UI
- automatic MCP discovery through shared bus/client
- direct API mode vs endpoint mode

### `@page-mcp/react`

This README should explain React integration ergonomics.

Primary focus:

- `PageMcpProvider`
- hooks for registration and client access
- intended usage in React apps

### `@page-mcp/vue3`

This README should explain Vue 3 integration ergonomics.

Primary focus:

- plugin
- provider
- composables

### `@page-mcp/vue2`

This README should explain Vue 2 integration ergonomics.

Primary focus:

- plugin
- mixin
- component option registration

## Language Requirement

Each package should provide:

- `README.md` for English
- `README.zh-CN.md` for Chinese

The Chinese version should not be a machine-generated literal clone. It should preserve the same structure and meaning, but read naturally in Chinese.

## Shared Documentation Rules

Each package README should include:

- package purpose
- installation
- minimal example
- core exports or usage surface
- relationship to adjacent packages

Avoid:

- long changelog-style sections
- stale examples using removed type names
- repeating the entire workspace architecture in every package

## Expected Outcome

After the rewrite:

- package boundaries should be obvious from the first screen
- `core` should be easier to adopt directly
- `protocol` should be easier to reuse in other projects
- framework and adapter packages should be easier to evaluate quickly
