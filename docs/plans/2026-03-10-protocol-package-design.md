# Protocol Package Design

## Goal

Extract the shared `Anthropic MCP`, `WebMCP`, and `Page MCP` protocol surface into a standalone package so multiple projects can depend on the same thin type-and-constants layer without taking a runtime dependency on `@page-mcp/core`.

## Problem

`@page-mcp/core` currently mixes:

- protocol definitions
- runtime implementation
- transport abstractions
- page-side DOM/resource resolution

This creates two problems:

1. projects that only need protocol types/constants still need to consume `core`
2. protocol ownership is harder to reason about because the implementation package also acts as the protocol package

## Design Summary

Introduce a new workspace package:

- `packages/protocol`
- package name: `@page-mcp/protocol`

The package contains only:

- pure type definitions
- pure protocol constants

The package does not contain:

- host/client implementations
- transport implementations
- browser adapters
- DOM resolvers
- runtime helpers that require implementation logic

`@page-mcp/core` becomes a pure implementation package that depends on `@page-mcp/protocol`.

## Package Boundaries

### `@page-mcp/protocol`

Owns:

- `Anthropic MCP` types
- `WebMCP` types
- `Page MCP` protocol extension types
- MCP method constants and request/response shape types

Does not own:

- runtime behavior
- stateful classes
- DOM/resource resolution
- extension transport/runtime objects

### `@page-mcp/core`

Owns:

- `PageMcpHost`
- `PageMcpClient`
- transports
- runtime capability execution
- page resource URI resolver
- skill runtime support

Depends on `@page-mcp/protocol` for protocol-facing types and constants.

## Export Structure

Recommended source files in `packages/protocol/src`:

- `anthropic-mcp.ts`
- `webmcp.ts`
- `page-mcp.ts`
- `mcp-types.ts`
- `index.ts`

Recommended exported symbols:

### `Anthropic MCP`

- `JsonSchema`
- `AnthropicMcpTool`
- `AnthropicMcpToolAnnotations`
- `AnthropicMcpResource`
- `AnthropicMcpResourceContent`
- `AnthropicMcpResourceReadResult`
- `AnthropicMcpPrompt`
- `AnthropicMcpPromptArgument`
- `AnthropicMcpPromptMessage`
- `AnthropicMcpPromptMessageContent`
- `AnthropicMcpPromptGetResult`

### `WebMCP`

- `WebMcpTool`
- `WebMcpToolExecute`

### `Page MCP`

- `PageMcpToolDefinition`
- `PageMcpResourceDefinition`
- `PageMcpPromptDefinition`

### MCP Native Surface

- `MCP_METHODS`
- `McpMethod`
- `McpRequest`
- `McpError`
- `McpResponse`
- `McpListParams`
- `McpListResult`

## Versioning Decision

This is a breaking package-boundary change and should use a new major version strategy.

The migration rule is intentionally direct:

- protocol types/constants move out of `@page-mcp/core`
- consumers must import protocol types from `@page-mcp/protocol`
- no compatibility re-exports from `@page-mcp/core`

This keeps the boundary explicit and avoids carrying duplicate public surfaces.

## README and Migration Strategy

The documentation should clearly state:

- `@page-mcp/protocol` is the protocol-only package
- `@page-mcp/core` is the implementation package
- protocol imports move from `@page-mcp/core` to `@page-mcp/protocol`

Recommended docs updates:

- new `packages/protocol/README.md`
- update `packages/core/README.md`
- update root `README.md`
- add a short migration note document

## Expected Benefits

- shared protocol surface across multiple projects
- thinner dependency for protocol-only consumers
- cleaner package responsibilities
- easier long-term evolution of `core` runtime internals without conflating them with protocol ownership
