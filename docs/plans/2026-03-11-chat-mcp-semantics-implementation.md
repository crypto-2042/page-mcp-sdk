# Chat MCP Semantics Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Align `@page-mcp/chat` with MCP semantics so only tools are automatically exposed to the model, while prompts remain user-controlled shortcuts and resources stay application-controlled.

**Architecture:** Keep the existing ChatEngine and ChatWidget structure, but narrow the default behavior. Remove prompt/resource system-message injection from the engine, keep tool exposure through the `tools` field, and filter prompt shortcut cards to only show prompts that can be invoked without required arguments.

**Tech Stack:** TypeScript, Vitest, DOM-based widget rendering

---

### Task 1: Lock the new ChatEngine MCP semantics with failing tests

**Files:**
- Modify: `packages/chat/test/chat-engine.streaming.test.ts`

**Step 1: Write the failing test**

Add assertions that:
- resources are not injected into OpenAI/system messages
- prompts are not injected into OpenAI/system messages
- tools are still passed in the API `tools` payload

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @page-mcp/chat exec vitest run test/chat-engine.streaming.test.ts`
Expected: FAIL because the current engine still injects prompt/resource context or otherwise violates the new semantic boundary.

**Step 3: Write minimal implementation**

Do not implement yet. This task only establishes the failing semantic contract.

### Task 2: Remove default prompt/resource system-context injection

**Files:**
- Modify: `packages/chat/src/chat-engine.ts`

**Step 1: Write minimal implementation**

Update `ChatEngine` so:
- resources are not appended to model-facing system messages
- prompts are not appended to model-facing system messages
- tools remain available through `buildOpenAITools()`

Keep prompt discovery itself available for the widget UI.

**Step 2: Run targeted test**

Run: `pnpm --filter @page-mcp/chat exec vitest run test/chat-engine.streaming.test.ts`
Expected: PASS for the new ChatEngine semantic assertions.

### Task 3: Filter prompt shortcut cards to directly invokable prompts only

**Files:**
- Modify: `packages/chat/src/chat-widget.ts`
- Modify: `packages/chat/test/chat-engine.streaming.test.ts` or add a focused widget test if needed

**Step 1: Write the failing test**

Add assertions that prompt shortcut rendering excludes prompts with required arguments.

**Step 2: Run test to verify it fails**

Run the relevant `@page-mcp/chat` test file.
Expected: FAIL because all prompts are currently shown.

**Step 3: Write minimal implementation**

Filter prompt cards so only prompts with:
- no `arguments`
- or arguments with no `required: true`

are rendered by default.

**Step 4: Run targeted test**

Run the relevant `@page-mcp/chat` test file again.
Expected: PASS

### Task 4: Run full verification

**Files:**
- Review: `packages/chat/src/chat-engine.ts`
- Review: `packages/chat/src/chat-widget.ts`
- Review: `packages/chat/test/chat-engine.streaming.test.ts`

**Step 1: Run tests**

Run: `pnpm --filter @page-mcp/chat exec vitest run`
Expected: PASS

**Step 2: Run typecheck**

Run: `pnpm --filter @page-mcp/chat run typecheck`
Expected: PASS

**Step 3: Review diff**

Run: `git diff -- packages/chat/src/chat-engine.ts packages/chat/src/chat-widget.ts packages/chat/test/chat-engine.streaming.test.ts docs/plans/2026-03-11-chat-mcp-semantics-design.md docs/plans/2026-03-11-chat-mcp-semantics-implementation.md`
Expected: only the chat semantic-alignment changes and associated plan docs
