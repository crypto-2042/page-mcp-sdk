# Chat Attach Resources Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an explicit resource attachment flow to `@page-mcp/chat` so users can choose page resources and attach their current contents to conversation turns.

**Architecture:** Keep resource usage application-controlled. Add lightweight resource discovery and attachment state to the engine/widget, expose a small attach UI in the widget, and inject selected resource contents as a per-turn context message during send. Also reserve `defaultAttachedResources` in config for future evolution.

**Tech Stack:** TypeScript, Vitest, DOM widget code

---

### Task 1: Lock resource attachment behavior with failing tests

**Files:**
- Modify: `packages/chat/test/chat-engine.streaming.test.ts`

**Step 1: Write the failing test**

Add tests that assert:
- selected resources are read before sending
- attached resource content is added to the outgoing request messages
- no resource attachment message is added when no resources are selected

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @page-mcp/chat exec vitest run test/chat-engine.streaming.test.ts`
Expected: FAIL because the engine currently has no resource attachment state or send-time resource reading.

### Task 2: Add engine-side resource attachment state and formatting

**Files:**
- Modify: `packages/chat/src/chat-engine.ts`
- Modify: `packages/chat/src/types.ts`

**Step 1: Write minimal implementation**

Add:
- discovered resources state
- selected resource URI state
- methods for:
  - listing resources
  - setting selected resource URIs
  - getting selected resource URIs
- send-time resource read + formatting

Inject selected resource contents as a single per-turn message immediately before the user message.

**Step 2: Run targeted test**

Run: `pnpm --filter @page-mcp/chat exec vitest run test/chat-engine.streaming.test.ts`
Expected: PASS for the new engine attachment assertions.

### Task 3: Add prompt-safe resource attach UI

**Files:**
- Modify: `packages/chat/src/chat-widget.ts`
- Modify: `packages/chat/src/styles.ts`
- Add or modify tests only if needed for extracted helpers

**Step 1: Write the failing test**

Prefer a small helper-level test if possible for:
- resource selection count
- default selected resource URIs

If a helper is not enough, add a minimal widget-facing test around pure selection logic.

**Step 2: Write minimal implementation**

Add:
- `Attach Resources` button
- lightweight resource panel
- checkbox list bound to engine resource selection state
- selected-count display

Keep the UI simple and avoid adding previews or advanced controls.

### Task 4: Add default attached resource config support

**Files:**
- Modify: `packages/chat/src/types.ts`
- Modify: `packages/chat/src/chat-engine.ts`
- Modify: `packages/chat/src/chat-widget.ts`

**Step 1: Write the failing test**

Add a test that verifies resources listed in `defaultAttachedResources` are selected on initialization.

**Step 2: Write minimal implementation**

Read `defaultAttachedResources` from config and initialize the selected resource set with those URIs.

**Step 3: Run targeted tests**

Run the relevant `@page-mcp/chat` tests.
Expected: PASS

### Task 5: Full verification

**Files:**
- Review: `packages/chat/src/chat-engine.ts`
- Review: `packages/chat/src/chat-widget.ts`
- Review: `packages/chat/src/styles.ts`
- Review: `packages/chat/src/types.ts`
- Review: `packages/chat/test/chat-engine.streaming.test.ts`

**Step 1: Run tests**

Run: `pnpm --filter @page-mcp/chat exec vitest run`
Expected: PASS

**Step 2: Run typecheck**

Run: `pnpm --filter @page-mcp/chat run typecheck`
Expected: PASS

**Step 3: Review diff**

Run: `git diff -- packages/chat/src/chat-engine.ts packages/chat/src/chat-widget.ts packages/chat/src/styles.ts packages/chat/src/types.ts packages/chat/test/chat-engine.streaming.test.ts docs/plans/2026-03-11-chat-attach-resources-design.md docs/plans/2026-03-11-chat-attach-resources-implementation.md`
Expected: only the attach-resources changes and associated plan docs
