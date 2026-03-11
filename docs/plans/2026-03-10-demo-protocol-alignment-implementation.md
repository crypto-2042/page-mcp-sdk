# Demo Protocol Alignment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update the demo so its resources, tools, and prompts reflect the current Page MCP protocol model, with resources fully migrated to declaration-only selector URIs.

**Architecture:** Keep the demo page as a single-file example, but replace legacy business-style resource registrations with selector-based declaration-only resources. Validate the demo by adding lightweight protocol-shape tests against `demo/index.html`, then make the smallest code changes necessary to satisfy them. Tools and prompts should only receive minimal consistency fixes if needed.

**Tech Stack:** HTML, inline browser JavaScript, Vitest

---

### Task 1: Lock the new demo resource contract with a failing test

**Files:**
- Modify: `packages/core/test/demo-skill-ui-removal.test.ts`

**Step 1: Write the failing test**

Extend the existing demo-facing test so it asserts:
- old `page://cart`, `page://products`, and `page://orders` resource registrations are gone
- selector-based resource URIs are present
- quick test actions use the new resource reads

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @page-mcp/core exec vitest run test/demo-skill-ui-removal.test.ts`
Expected: FAIL because the demo still contains legacy resource registrations and quick-test actions.

**Step 3: Write minimal implementation**

Do not implement yet. This task only establishes the failing assertions.

**Step 4: Commit**

Skip commit in-session.

### Task 2: Migrate demo resources to declaration-only selector URIs

**Files:**
- Modify: `demo/index.html`

**Step 1: Write minimal implementation**

Replace the legacy resource registrations:
- `page://cart`
- `page://products`
- `page://orders`

with declaration-only resources using:
- `page://selector/<encoded-selector>`

Add the recommended resources:
- visible product names
- visible product prices
- cart summary text
- latest order card

Set `mimeType` explicitly for each resource.

**Step 2: Update debug UI resource display**

Adjust the MCP debug resource list in `renderMcpDebug()` so it shows the new semantic names and selector URIs.

**Step 3: Update quick test actions**

Change the quick test action labels and `qTest()` logic so they read the new selector resources instead of legacy business URIs.

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @page-mcp/core exec vitest run test/demo-skill-ui-removal.test.ts`
Expected: PASS

### Task 3: Review tools and prompts for protocol consistency

**Files:**
- Modify: `demo/index.html`

**Step 1: Write the failing test**

Add assertions to the demo-facing test that:
- tools still register with `execute`
- read-only tools still use `annotations.readOnlyHint`
- prompts still register with `handler`
- prompt handler results still return `messages`

**Step 2: Run test to verify it fails if needed**

Run: `pnpm --filter @page-mcp/core exec vitest run test/demo-skill-ui-removal.test.ts`
Expected: either PASS immediately if the current demo already matches, or FAIL with the missing field/shape.

**Step 3: Write minimal implementation**

Only if the test reveals a mismatch, make the smallest possible updates in `demo/index.html`.

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @page-mcp/core exec vitest run test/demo-skill-ui-removal.test.ts`
Expected: PASS

### Task 4: Run full core verification

**Files:**
- Review: `packages/core/test/demo-skill-ui-removal.test.ts`
- Review: `demo/index.html`

**Step 1: Run the full core test suite**

Run: `pnpm --filter @page-mcp/core exec vitest run`
Expected: PASS

**Step 2: Review demo diff**

Run: `git diff -- demo/index.html packages/core/test/demo-skill-ui-removal.test.ts docs/plans/2026-03-10-demo-protocol-alignment-design.md docs/plans/2026-03-10-demo-protocol-alignment-implementation.md`
Expected: only the demo protocol-alignment changes and associated plan docs

**Step 3: Commit**

Skip commit in-session.
