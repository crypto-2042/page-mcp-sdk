# Demo Simplification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deeply simplify `demo/index.html` so it remains a real validation surface for tools, resources, and prompts without overlapping responsibilities.

**Architecture:** Keep the TechMart demo page but narrow the MCP example surface. Reduce the demo to a single coherent shopping-assistant scenario with four tools, three resources, and three prompts. Remove temporary chat-verification helpers and keep only lightweight debug support plus real chat behavior.

**Tech Stack:** HTML, inline browser JavaScript, Vitest

---

### Task 1: Lock the simplified MCP surface with failing tests

**Files:**
- Modify: `packages/core/test/demo-skill-ui-removal.test.ts`

**Step 1: Write the failing test**

Add assertions that:
- removed tools are absent
- removed prompts are absent
- removed resources are absent
- `Chat Verification` is absent
- `defaultAttachedResources` only includes product names + cart summary

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @page-mcp/core exec vitest run test/demo-skill-ui-removal.test.ts`
Expected: FAIL because the current demo still exposes the broader MCP surface.

### Task 2: Simplify the tool/resource/prompt definitions

**Files:**
- Modify: `demo/index.html`

**Step 1: Write minimal implementation**

Retain only:
- tools: `searchProducts`, `getProductInfo`, `addToCart`, `placeOrder`
- resources: product names, product prices, cart summary
- prompts: `recommend-products`, `deal-finder`, `cart-summary`

Remove all other demo MCP definitions and references to them.

**Step 2: Run targeted test**

Run the demo-facing test.
Expected: PASS for the simplified surface assertions.

### Task 3: Remove temporary chat verification helpers and keep real chat defaults

**Files:**
- Modify: `demo/index.html`

**Step 1: Write minimal implementation**

Remove:
- `Chat Verification` section
- prefill helper code
- temporary verification message map

Keep:
- `defaultAttachedResources`

Ensure only these defaults remain:
- `page://selector/.product-name`
- `page://selector/#cart-total`

### Task 4: Switch the resource attachment control to an icon button

**Files:**
- Modify: `packages/chat/src/chat-widget.ts`
- Modify: `packages/chat/src/styles.ts`
- Add or update tests only if needed for helper-level coverage

**Step 1: Write the failing test**

Add a small helper or markup assertion test that locks icon-button behavior or the badge label logic if needed.

**Step 2: Write minimal implementation**

Replace the text-oriented resource attach button with an icon-style control and keep the selected count badge visible.

### Task 5: Full verification

**Files:**
- Review: `demo/index.html`
- Review: `packages/core/test/demo-skill-ui-removal.test.ts`
- Review: `packages/chat/src/chat-widget.ts`
- Review: `packages/chat/src/styles.ts`

**Step 1: Run demo-facing test**

Run: `pnpm --filter @page-mcp/core exec vitest run test/demo-skill-ui-removal.test.ts`
Expected: PASS

**Step 2: Run full core test suite**

Run: `pnpm --filter @page-mcp/core exec vitest run`
Expected: PASS

**Step 3: Run chat tests**

Run: `pnpm --filter @page-mcp/chat exec vitest run`
Expected: PASS

**Step 4: Run chat typecheck**

Run: `pnpm --filter @page-mcp/chat run typecheck`
Expected: PASS

**Step 5: Review diff**

Run: `git diff -- demo/index.html packages/core/test/demo-skill-ui-removal.test.ts packages/chat/src/chat-widget.ts packages/chat/src/styles.ts docs/plans/2026-03-11-demo-simplification-design.md docs/plans/2026-03-11-demo-simplification-implementation.md`
Expected: only the demo simplification and resource-button polish changes
