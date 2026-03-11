# @page-mcp/protocol

Protocol-only package for Page MCP. Use this package when you need shared MCP/WebMCP/Page MCP types and constants without pulling in runtime implementation.

## What This Package Does

- exports shared protocol types
- exports MCP-native method constants
- defines the Page MCP protocol extension surface
- stays runtime-free

## When To Use It

Use `@page-mcp/protocol` when you are:

- sharing protocol types across multiple projects
- building adapters around Page MCP
- writing code that only needs compile-time protocol contracts

Do not use it when you need a running host, client, or transport. For that, use `@page-mcp/core`.

## Installation

```bash
npm install @page-mcp/protocol
```

## Minimal Example

```ts
import type {
  AnthropicMcpTool,
  PageMcpToolDefinition,
  McpRequest,
} from '@page-mcp/protocol';

const tool: PageMcpToolDefinition = {
  name: 'sum',
  description: 'Sum two numbers',
  execute: async (input) => Number(input.a) + Number(input.b),
};

const request: McpRequest = {
  id: '1',
  method: 'tools/list',
};
```

## Core Exports

- `AnthropicMcp*`
  - MCP-facing tools, resources, prompts, and JSON schema types
- `WebMcp*`
  - WebMCP tool execution types
- `PageMcp*`
  - Page MCP protocol extension types
- `MCP_METHODS`, `Mcp*`
  - MCP-native request/response and method constants

## What It Does Not Include

This package does not include:

- `PageMcpHost`
- `PageMcpClient`
- transports
- DOM/resource resolution
- polyfills
- browser runtime helpers

## Relationship To Other Packages

- `@page-mcp/core`
  - runtime implementation
- `@page-mcp/webmcp-adapter`
  - browser adapter layer
- framework packages
  - may re-export or consume these protocol types
