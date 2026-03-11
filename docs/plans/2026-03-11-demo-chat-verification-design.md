# Demo Chat Verification Design

## Goal

Adjust `demo/index.html` so the current chat behavior around tools, resources, and prompts can be verified quickly by hand.

This is a demo usability change, not a protocol change.

## Current Problem

The demo currently has the right building blocks, but fast verification is awkward:

- tools in the demo are commented out, so tool behavior cannot actually be exercised from chat
- resources and prompts exist, but there is no dedicated guidance for verifying them through the chat widget
- the chat now supports explicit resource attachment and default attached resources, but the demo does not expose an obvious validation flow

The result is that validating chat behavior requires manually guessing prompts, resource selection, and tool-triggering phrases.

## Recommended Scope

Make the demo verification-focused without turning it into a separate test harness.

Changes:

1. Restore the existing demo tool registrations.
2. Initialize the chat widget with default attached resources:
   - `page://selector/.product-name`
   - `page://selector/#cart-total`
3. Add a `Chat Verification` section inside the existing MCP Debug modal.
4. Add three buttons:
   - `Test Prompts`
   - `Test Resources`
   - `Test Tools`
5. Each button should prefill the chat input with a recommended test phrase, but not auto-send.

This keeps the demo easy to reason about while giving a fast path to verify current chat semantics.

## Verification Intent By Button

### Test Prompts

Purpose:

- verify that prompt cards are visible
- verify that clicking a prompt card inserts the intended user-facing behavior into chat flow

Suggested text to prefill:

`Recommend three products for a tech gift under $300.`

### Test Resources

Purpose:

- verify that default attached resources are active
- verify that the model can use attached resource contents for the current turn

Suggested text to prefill:

`Use the attached page resources to summarize the visible product names and current cart total.`

### Test Tools

Purpose:

- verify that tools are available to the model and can be executed through chat

Suggested text to prefill:

`Find the cheapest in-stock product and add one to my cart.`

## Debug Modal Placement

Place the new controls in the existing MCP Debug modal, separate from low-level RPC quick tests.

Recommended structure:

- RPC Console
- Quick Test
- Chat Verification

This keeps:

- RPC testing for protocol/debug inspection
- chat verification for product-level behavior

without mixing the two into one row of buttons.

## Testing Strategy

Use a lightweight demo-facing regression test similar to the existing demo HTML tests.

Validate:

- demo tools are no longer commented out
- chat config includes `defaultAttachedResources`
- debug modal includes `Chat Verification`
- the three verification buttons exist
- each button maps to the expected verification phrase

The test should lock the fast-verification affordances, not the exact visual presentation.
