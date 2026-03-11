# Chat Direct Mode Streaming Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable streaming responses in `@page-mcp/chat` direct OpenAI mode with backward-compatible opt-out.

**Architecture:** Keep the current `fetch`-based OpenAI-compatible transport, add SSE parsing for `chat/completions` stream chunks, and emit incremental UI events through existing `message:stream`/`message:update` hooks. Preserve non-stream mode via config flag for compatibility.

**Tech Stack:** TypeScript, Vitest, fetch-based SSE parsing

---

### Task 1: Add tests and test runner for chat package

**Files:**
- Create: `packages/chat/test/chat-engine.streaming.test.ts`
- Create: `packages/chat/vitest.config.ts`
- Modify: `packages/chat/package.json`

1. Add Vitest config and package scripts/dev dependency.
2. Write failing test for direct-mode streaming content assembly and event emission.
3. Run test to verify failure.

### Task 2: Implement direct-mode streaming in ChatEngine

**Files:**
- Modify: `packages/chat/src/types.ts`
- Modify: `packages/chat/src/chat-engine.ts`
- Modify: `packages/chat/README.md`

1. Add `openai.stream?: boolean` config (default enabled).
2. Implement SSE parsing and incremental message updates in direct mode.
3. Keep non-stream path working with `stream: false` when disabled.
4. Run chat package tests and typecheck.
