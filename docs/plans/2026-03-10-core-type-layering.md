# Core Type Layering Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Split `@page-mcp/core` type definitions into explicit `Anthropic MCP`, `WebMCP`, and `Page MCP SDK` layers, remove misattributed fields, and document the structure evolution in the core README.

**Architecture:** Move shared type definitions out of the mixed `types.ts` surface into source-specific modules. Keep runtime behavior stable where possible, but force the public type API to use source-explicit names and remove fields that do not belong to the current MCP standard surface. Update host/client typing to consume the new layers and refresh tests to assert the new export boundary.

**Tech Stack:** TypeScript, Vitest, tsup, pnpm

---

### Task 1: Lock the new export boundary with tests

**Files:**
- Modify: `packages/core/test/core-exports.test.ts`
- Create: `packages/core/test/type-layering.test.ts`

**Step 1: Write the failing test**

Add tests that assert:
- legacy mixed export names like `ToolDefinition`, `ToolInfo`, `PromptDefinition`, `ResourceDefinition`, `ToolAnnotations` are no longer exported
- new names like `AnthropicMcpTool`, `AnthropicMcpPrompt`, `AnthropicMcpResource`, `WebMcpTool`, `WebMcpToolExecute`, `PageMcpToolDefinition`, `PageMcpPromptDefinition`, `PageMcpResourceDefinition` are exported

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @page-mcp/core exec vitest run test/core-exports.test.ts test/type-layering.test.ts`
Expected: FAIL because the new exports do not exist yet and the old exports still do

**Step 3: Write minimal implementation**

Do not implement production code in this task.

**Step 4: Run test to verify it still fails correctly**

Run: `pnpm --filter @page-mcp/core exec vitest run test/core-exports.test.ts test/type-layering.test.ts`
Expected: FAIL on missing new exports or unexpected legacy exports, not syntax errors

### Task 2: Split the mixed type surface into source-specific modules

**Files:**
- Create: `packages/core/src/anthropic-mcp.ts`
- Create: `packages/core/src/webmcp.ts`
- Create: `packages/core/src/page-mcp.ts`
- Modify: `packages/core/src/types.ts`
- Modify: `packages/core/src/index.ts`

**Step 1: Write the failing test**

Use the tests from Task 1 as the failing proof.

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @page-mcp/core exec vitest run test/core-exports.test.ts test/type-layering.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

Implement:
- `anthropic-mcp.ts` with standard MCP-facing types for tools/resources/prompts and common pagination/request/response types
- `webmcp.ts` with browser execution additions for tools, centered on `execute`
- `page-mcp.ts` with SDK registration wrappers for tools/resources/prompts and host/client-facing capability types
- keep `types.ts` as an internal compatibility aggregation module if needed by runtime files, but stop re-exporting old public names from `index.ts`
- remove `securitySchemes` from the MCP tool surface

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @page-mcp/core exec vitest run test/core-exports.test.ts test/type-layering.test.ts`
Expected: PASS

### Task 3: Rewire host and client types to the new layered model

**Files:**
- Modify: `packages/core/src/host.ts`
- Modify: `packages/core/src/client.ts`
- Modify: `packages/core/test/tools-contract.test.ts`
- Modify: `packages/core/test/resources-contract.test.ts`
- Modify: `packages/core/test/prompts-contract.test.ts`
- Modify: `packages/core/test/client-standard-methods.test.ts`

**Step 1: Write the failing test**

Adjust or add tests to assert:
- tool list/call still behaves the same at runtime
- resources and prompts still behave the same at runtime
- compile-time-visible result names align with the new MCP/WebMCP/PageMCP naming split

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @page-mcp/core exec vitest run test/tools-contract.test.ts test/resources-contract.test.ts test/prompts-contract.test.ts test/client-standard-methods.test.ts`
Expected: FAIL due to imports/types drifting from the new model

**Step 3: Write minimal implementation**

Update `host.ts` and `client.ts` imports and signatures so:
- list methods expose `AnthropicMcp*` metadata/result types
- tool registration uses `PageMcpToolDefinition`
- prompt/resource registration uses `PageMcpPromptDefinition` / `PageMcpResourceDefinition`

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @page-mcp/core exec vitest run test/tools-contract.test.ts test/resources-contract.test.ts test/prompts-contract.test.ts test/client-standard-methods.test.ts`
Expected: PASS

### Task 4: Document the structure evolution in the core README

**Files:**
- Modify: `packages/core/README.md`

**Step 1: Write the failing test**

No automated test required; use docs review and type/test verification as evidence.

**Step 2: Write minimal implementation**

Add a `Structure Evolution` section covering:
- why the old mixed type surface was ambiguous
- current ownership of MCP, WebMCP, and Page MCP SDK fields
- the final tool layering: `Anthropic MCP metadata -> WebMCP execute -> Page MCP SDK registration wrapper`
- note that `securitySchemes` is not part of the current official MCP tool surface used here

**Step 3: Verify manually**

Review: `packages/core/README.md`
Expected: the field ownership and migration rationale are explicit and consistent with source code

### Task 5: Run final verification

**Files:**
- No code changes

**Step 1: Run targeted test suite**

Run: `pnpm --filter @page-mcp/core exec vitest run`
Expected: PASS

**Step 2: Run typecheck**

Run: `pnpm --filter @page-mcp/core run typecheck`
Expected: PASS

**Step 3: Review changed files**

Run: `git diff -- packages/core docs/plans/2026-03-10-core-type-layering.md`
Expected: only the planned core type split, tests, and README/doc changes appear
