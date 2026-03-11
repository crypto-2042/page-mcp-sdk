# Demo Simplification Design

## Goal

Deeply refactor `demo/index.html` so it is easier to use as a real validation target for `tools`, `resources`, and `prompts`.

The new demo should still cover all three MCP primitive categories, but each category should have a clear role and minimal overlap.

## Current Problem

The current demo mixes too many overlapping examples:

- too many tools with similar responsibilities
- resources and tools both partially cover “state lookup”
- prompts overlap in intent and are broader than needed for stable testing
- debug UI contains temporary verification affordances that are not part of the actual product flow

This makes testing harder because:

- the model has multiple valid paths for the same task
- it is not obvious which primitive is supposed to handle which scenario
- the demo behaves more like a staging playground than a focused validation surface

## Target Shape

Keep the TechMart theme, but simplify the MCP layer into one coherent shopping-assistant scenario.

### Tools

Keep only four:

1. `searchProducts`
2. `getProductInfo`
3. `addToCart`
4. `placeOrder`

Rationale:

- `searchProducts` covers read/query behavior
- `getProductInfo` covers targeted detail lookup
- `addToCart` covers write behavior
- `placeOrder` covers execution/final action

Remove:

- `getProductList`
- `checkStock`
- `removeFromCart`
- `getCartContents`
- `quickBuy`

These create redundant tool paths and make tool behavior harder to verify consistently.

### Resources

Keep only three declaration-only resources:

1. `Visible Product Names`
2. `Visible Product Prices`
3. `Cart Summary Text`

Remove:

- `Latest Order Card`

Rationale:

- names and prices give stable product-page context
- cart summary gives stable current-state context
- order HTML is less useful for normal chat validation and adds noise

### Prompts

Keep only three prompt shortcuts:

1. `recommend-products`
2. `deal-finder`
3. `cart-summary`

Remove:

- `compare-all`
- `gift-ideas`
- `tech-support`

Rationale:

- the retained prompts map cleanly to the retained resources/tools
- all remaining prompts are no-arg shortcuts
- the removed prompts are broader, more overlapping, or less stable for testing

## Debug UI Changes

The MCP Debug modal should be simplified:

- keep tools/resources/prompts sections
- keep RPC console
- keep basic protocol quick tests
- remove `Chat Verification`

The demo should no longer include test-only chat prefilling buttons.

## Chat Defaults

Keep default attached resources for real chat validation, but limit them to:

- `page://selector/.product-name`
- `page://selector/#cart-total`

Do not auto-attach prices by default.

This keeps resource context lightweight while still making resource attachment testable in a real conversation.

## Resource Button UI

The chat widget’s resource attachment control should be presented as an icon button rather than a text button.

Requirements:

- icon-only default appearance
- selected count remains visible as a badge
- behavior remains unchanged

This keeps the composer area cleaner and more product-like.

## Code Organization In Demo

Even though `demo/index.html` stays single-file, the internal structure should be clarified:

1. data store and page rendering
2. MCP definitions
3. chat bootstrap/config
4. debug helpers

This reduces the current interleaving of:

- prompt text definitions
- quick-test logic
- chat helpers
- debug rendering

## Testing Strategy

Use the existing demo-facing HTML test to lock the simplified surface.

Tests should verify:

- only the intended tools remain
- only the intended resources remain
- only the intended prompts remain
- `Chat Verification` is gone
- `defaultAttachedResources` remains limited to names + cart summary
- the demo no longer contains the removed examples

The goal is to validate simplification and role clarity, not exact formatting.
