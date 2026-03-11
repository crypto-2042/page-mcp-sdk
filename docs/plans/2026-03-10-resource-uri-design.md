# Resource URI Design

## Goal

Define a declaration-first `resources` model for `@page-mcp/core` where pages expose semantic resource names to LLMs while the page side resolves DOM data from a structured `uri`.

## Background

The current `PageMcpResourceDefinition` requires a per-resource `handler`. That works for bespoke resources, but it scales poorly for page-adaptation scenarios where most resources are simple DOM reads.

The design goal is:

- resources stay visible to LLMs as semantic entries through `name` and `description`
- pages only declare resources when integrating the SDK
- the page side uses a shared resolver driven by `uri`
- complex extraction remains outside this design scope

## Design Summary

`resources` are treated as declared page query entries:

- `name` and `description` are for LLM selection
- `uri` is for page-side resolution
- `mimeType` determines the response representation
- `PageMcpHost` provides the shared resolver for `resources/read`

This is intentionally different from using resource URIs as stable business object identifiers. Here, the URI is a page-mcp-sdk query protocol.

## Resource Definition

`PageMcpResourceDefinition` should become declaration-only:

```ts
type PageMcpResourceDefinition = {
  uri: string
  name: string
  description: string
  mimeType?: 'text/plain' | 'text/html' | 'application/json'
}
```

Constraints:

- no per-resource `handler`
- resources are listed explicitly via `registerResource`
- the same shared resolver serves all registered resources

## URI Grammar

Supported URI forms:

```text
page://selector/<encoded-css-selector>
page://xpath/<encoded-xpath>
```

Rules:

- the selector payload is URI-encoded before registration
- `selector` means CSS selector lookup
- `xpath` means XPath lookup
- unsupported schemes or invalid payloads are read-time errors

## MIME Semantics

`mimeType` is the only output-format control. No `format` field is used.

### `text/plain`

- query all matching nodes
- return the `textContent` of the first matched node
- if no node matches, return an empty string payload or empty content according to implementation choice, but keep the MCP shape stable

### `text/html`

- query all matching nodes
- return the `outerHTML` of the first matched node

### `application/json`

- return a JSON string in MCP resource content
- the JSON must have a fixed top-level shape:

```json
{ "content": ... }
```

`content` semantics:

- single matched node with no element children:
  - `["node.textContent"]`
- single matched node with element children:
  - `["child0.textContent", "child1.textContent"]`
- multiple matched nodes where each node has no element children:
  - `["node1.textContent", "node2.textContent"]`
- multiple matched nodes where nodes have element children:
  - `[["node1.child0.textContent"], ["node2.child0.textContent"]]`

This intentionally defines a lightweight text-oriented JSON form, not a full DOM snapshot and not a business-specific JSON schema.

## Host Responsibilities

`PageMcpHost` should own the shared resource resolver. On `resources/read`, it should:

1. locate the declared resource by `uri`
2. parse the URI into `engine + selector payload`
3. execute DOM lookup
4. serialize the result based on `mimeType`
5. return standard MCP `contents[]`

The page-side integration point remains simple:

```ts
host.registerResource({
  uri: 'page://selector/.product-title',
  name: 'Current Product Title',
  description: 'Visible title of the current product',
  mimeType: 'text/plain',
});
```

## Non-Goals

This design does not define:

- business-specific JSON extraction
- custom field-mapping DSL
- complex flow or side-effecting operations

## Expected Benefits

- zero-code resource declaration for common page reads
- semantic resource names remain available to LLMs
- URI-driven resolution removes repetitive handlers
- output semantics stay stable through MIME-based rules
