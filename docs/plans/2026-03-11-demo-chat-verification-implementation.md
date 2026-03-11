# Demo Chat Verification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update `demo/index.html` so tools, resources, and prompts in the chat widget can be verified quickly through a guided demo flow.

**Architecture:** Keep the demo as a single-page example. Restore the existing demo tools, preconfigure default attached resources for chat, and extend the MCP Debug modal with a small chat-verification section that prefills recommended test phrases without auto-sending.

**Tech Stack:** HTML, inline browser JavaScript, Vitest

---

### Task 1: Lock the new demo verification affordances with a failing test

**Files:**
- Modify: `packages/core/test/demo-skill-ui-removal.test.ts`

**Step 1: Write the failing test**

Add assertions that:
- demo tools are registered again
- `defaultAttachedResources` is present in the chat config
- MCP Debug modal contains `Chat Verification`
- verification buttons for prompts/resources/tools exist
- the button handlers reference the expected verification phrases

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @page-mcp/core exec vitest run test/demo-skill-ui-removal.test.ts`
Expected: FAIL because the demo does not yet contain the new verification UI and tools are still commented out.

### Task 2: Restore demo tools and default attached resources

**Files:**
- Modify: `demo/index.html`

**Step 1: Write minimal implementation**

Uncomment or restore the existing demo tool registrations:
- read tools
- write tools
- execute tools

Update chat initialization so `defaultAttachedResources` includes:
- `page://selector/.product-name`
- `page://selector/#cart-total`

**Step 2: Run targeted test**

Run the demo-facing test.
Expected: closer to passing, but still missing verification UI if not added yet.

### Task 3: Add Chat Verification controls to the debug modal

**Files:**
- Modify: `demo/index.html`

**Step 1: Write minimal implementation**

Add a `Chat Verification` section inside the right column of the MCP Debug modal with three buttons:
- `Test Prompts`
- `Test Resources`
- `Test Tools`

Each button should prefill the chat input with a recommended validation phrase without sending it automatically.

**Step 2: Add helper logic**

Add a small helper that:
- locates the chat widget input if available
- sets its value
- dispatches an input event
- optionally opens the chat widget if needed

### Task 4: Run full verification

**Files:**
- Review: `demo/index.html`
- Review: `packages/core/test/demo-skill-ui-removal.test.ts`

**Step 1: Run tests**

Run: `pnpm --filter @page-mcp/core exec vitest run test/demo-skill-ui-removal.test.ts`
Expected: PASS

**Step 2: Run full core test suite**

Run: `pnpm --filter @page-mcp/core exec vitest run`
Expected: PASS

**Step 3: Review diff**

Run: `git diff -- demo/index.html packages/core/test/demo-skill-ui-removal.test.ts docs/plans/2026-03-11-demo-chat-verification-design.md docs/plans/2026-03-11-demo-chat-verification-implementation.md`
Expected: only the demo verification changes and associated plan docs
