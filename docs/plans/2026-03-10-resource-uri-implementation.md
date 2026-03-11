# Resource URI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert `@page-mcp/core` resources from per-resource handlers to declaration-only DOM query resources resolved from `uri` and `mimeType`.

**Architecture:** Move resource execution into `PageMcpHost` by introducing a shared URI resolver for `page://selector/...` and `page://xpath/...`. Keep MCP list/read behavior stable while changing `PageMcpResourceDefinition` to declaration-only and documenting the new protocol in the core README.

**Tech Stack:** TypeScript, Vitest, pnpm, DOM APIs

---

### Task 1: Lock the new resource shape with failing tests

**Files:**
- Modify: `packages/core/test/resources-contract.test.ts`
- Create: `packages/core/test/resource-uri-resolution.test.ts`

**Step 1: Write the failing test**

Add tests that assert:
- `registerResource()` accepts declaration-only resources without `handler`
- `resources/read` resolves `page://selector/...` and `page://xpath/...`
- `text/plain`, `text/html`, and `application/json` follow the approved semantics

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @page-mcp/core exec vitest run test/resources-contract.test.ts test/resource-uri-resolution.test.ts`
Expected: FAIL because resources currently require `handler` and the host has no URI resolver

**Step 3: Write minimal implementation**

Do not write production code in this task.

**Step 4: Run test to verify it still fails correctly**

Run: `pnpm --filter @page-mcp/core exec vitest run test/resources-contract.test.ts test/resource-uri-resolution.test.ts`
Expected: FAIL on missing feature behavior, not syntax errors

### Task 2: Change the public resource definition type

**Files:**
- Modify: `packages/core/src/page-mcp.ts`
- Modify: `packages/core/src/index.ts`
- Modify: `packages/core/src/types.ts`
- Test: `packages/core/test/type-layering.types.ts`

**Step 1: Write the failing test**

Extend the type-layering assertions so `PageMcpResourceDefinition` no longer requires `handler`.

**Step 2: Run test to verify it fails**

Run: `pnpm exec tsc --noEmit --target ES2020 --module ESNext --moduleResolution bundler --strict --esModuleInterop --skipLibCheck test/type-layering.types.ts`
Workdir: `packages/core`
Expected: FAIL until the type is updated

**Step 3: Write minimal implementation**

Update `PageMcpResourceDefinition` to:

```ts
export interface PageMcpResourceDefinition extends AnthropicMcpResource {
  mimeType?: 'text/plain' | 'text/html' | 'application/json';
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm exec tsc --noEmit --target ES2020 --module ESNext --moduleResolution bundler --strict --esModuleInterop --skipLibCheck test/type-layering.types.ts`
Workdir: `packages/core`
Expected: PASS

### Task 3: Implement host-side URI parsing and DOM resolution

**Files:**
- Modify: `packages/core/src/host.ts`
- Test: `packages/core/test/resource-uri-resolution.test.ts`

**Step 1: Write the failing test**

Cover:
- CSS selector URI parsing
- XPath URI parsing
- first-node behavior for `text/plain`
- first-node behavior for `text/html`
- fixed `{ content: ... }` JSON serialization
- no-match behavior
- invalid URI behavior

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @page-mcp/core exec vitest run test/resource-uri-resolution.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

Add host helpers for:
- URI parsing
- CSS selector lookup
- XPath lookup
- JSON content shaping
- MCP resource content wrapping

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @page-mcp/core exec vitest run test/resource-uri-resolution.test.ts`
Expected: PASS

### Task 4: Update existing resource contract tests

**Files:**
- Modify: `packages/core/test/resources-contract.test.ts`
- Modify: `packages/core/test/client-standard-methods.test.ts`

**Step 1: Write the failing test**

Adjust existing tests to use declaration-only resource registration and assert client behavior remains MCP-compatible.

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @page-mcp/core exec vitest run test/resources-contract.test.ts test/client-standard-methods.test.ts`
Expected: FAIL until tests and implementation agree

**Step 3: Write minimal implementation**

Update tests and any required production typing to align with the new resource model.

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @page-mcp/core exec vitest run test/resources-contract.test.ts test/client-standard-methods.test.ts`
Expected: PASS

### Task 5: Document the resource URI protocol

**Files:**
- Modify: `packages/core/README.md`
- Reference: `docs/plans/2026-03-10-resource-uri-design.md`

**Step 1: Write minimal implementation**

Document:
- declaration-only resources
- supported URI grammar
- MIME semantics
- approved JSON content rules

**Step 2: Verify manually**

Review: `packages/core/README.md`
Expected: resource examples and field ownership match the approved design

### Task 6: Run final verification

**Files:**
- No code changes

**Step 1: Run core tests**

Run: `pnpm --filter @page-mcp/core exec vitest run`
Expected: PASS

**Step 2: Run core typecheck**

Run: `pnpm --filter @page-mcp/core run typecheck`
Expected: PASS

**Step 3: Review diff**

Run: `git diff -- packages/core docs/plans/2026-03-10-resource-uri-design.md docs/plans/2026-03-10-resource-uri-implementation.md`
Expected: only resource URI protocol changes and supporting docs/tests
