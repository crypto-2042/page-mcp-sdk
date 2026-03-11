# Demo Protocol Alignment Design

## Goal

Update the `demo` examples so they reflect the current Page MCP protocol shape:

- resources are declaration-only DOM resources using `page://selector/...` URIs
- tools remain `execute`-based and use MCP/WebMCP-compatible metadata
- prompts remain MCP prompt templates wrapped by the page-mcp-sdk `handler`

The immediate scope is limited to the demo page. Runtime APIs outside the demo are not being redesigned in this task.

## Current Gaps

The current demo still registers legacy business-style resources:

- `page://cart`
- `page://products`
- `page://orders`

Each of these uses a per-resource `handler`, which is no longer the current resource model in `@page-mcp/core`.

By contrast:

- demo `tools` already use `execute`
- demo `prompts` already use `handler` and return `{ messages }`

So the main protocol mismatch is in `resources`.

## Recommended Approach

Use declaration-only DOM resources in the demo and keep tools/prompts behaviorally unchanged.

This means:

1. Remove the legacy resource registrations entirely.
2. Replace them with a small set of selector-based resources that demonstrate:
   - `application/json`
   - `text/plain`
   - `text/html`
3. Update debug UI quick tests to read these new resources.
4. Review tools/prompts and only make minimal consistency fixes if a field no longer matches current protocol expectations.

This keeps the demo aligned with the current spec while minimizing unrelated behavior churn.

## Resource Design

The demo should expose a small set of declaration-only resources that have:

- semantic `name`
- semantic `description`
- selector-based `uri`
- explicit `mimeType`

Recommended resources:

1. `Visible Product Names`
   - purpose: show multi-node `application/json` aggregation
   - selector target: product card names
2. `Visible Product Prices`
   - purpose: show multi-node `application/json` aggregation on another field
   - selector target: product prices
3. `Cart Summary Text`
   - purpose: show single-node `text/plain`
   - selector target: cart total
4. `Latest Order Card`
   - purpose: show single-node `text/html`
   - selector target: first order card

These resources should be readable from the built-in host resolver without any per-resource JavaScript handler.

## Tool And Prompt Review

### Tools

The demo tools are already structurally close to the current protocol:

- `name`
- `description`
- `inputSchema`
- `execute`
- `annotations.readOnlyHint` on read-only tools

Planned action:

- keep the existing tools
- verify read-only tools still carry `readOnlyHint`
- avoid renaming tools or changing behavior in this task

### Prompts

The demo prompts also fit the current page-mcp-sdk wrapper model:

- `name`
- `description`
- `handler(args) => { messages }`

Planned action:

- keep the existing prompts
- verify returned message shape remains MCP-compatible
- avoid changing prompt names or shortcut behavior

## Debug UI Changes

The demo MCP debug console should show the new resources instead of the old business-style resource URIs.

Quick test actions should be updated to read the new resources directly, for example:

- `Read Product Names`
- `Read Cart Summary`

This keeps the visible demo aligned with the declaration-only resource model.

## Testing Strategy

Use TDD with lightweight demo-facing tests.

Add or update tests to verify:

- legacy resource registrations no longer appear in the demo HTML
- selector-based resource registrations do appear
- demo quick test actions now read the new resource URIs
- tools still expose `execute`
- prompts still use `handler` and return `{ messages }`

The goal is not to exhaustively test the demo UI, but to lock the protocol-facing example shape.
