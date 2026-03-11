# Protocol Package Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create `@page-mcp/protocol`, move shared protocol types/constants out of `@page-mcp/core`, and update the workspace to consume the new package without legacy compatibility exports.

**Architecture:** Add a new workspace package that owns the pure `Anthropic MCP`, `WebMCP`, `Page MCP`, and MCP-native protocol surface. Rewire `@page-mcp/core` to import protocol definitions from the new package and remove direct protocol-type exports from `core` in favor of the new package.

**Tech Stack:** TypeScript, tsup, pnpm workspace, Vitest

---

### Task 1: Lock the new package boundary with failing tests

**Files:**
- Create: `packages/protocol/test/protocol-exports.test.ts`
- Modify: `packages/core/test/core-exports.test.ts`
- Modify: `packages/core/test/type-layering.types.ts`

**Step 1: Write the failing test**

Add tests that assert:
- `@page-mcp/protocol` exports the protocol types/constants
- `@page-mcp/core` no longer exports protocol types/constants
- existing `core` runtime exports remain available

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @page-mcp/core exec vitest run test/core-exports.test.ts`
Expected: FAIL once the tests expect protocol exports to disappear from `core`

Run: `pnpm exec tsc --noEmit --target ES2020 --module ESNext --moduleResolution bundler --strict --esModuleInterop --skipLibCheck test/type-layering.types.ts`
Workdir: `packages/core`
Expected: FAIL because imports still point at `core`

**Step 3: Write minimal implementation**

Do not implement production code in this task.

**Step 4: Run test to verify it still fails correctly**

Run the same commands and confirm failures are due to the missing package boundary, not syntax errors.

### Task 2: Create the new `@page-mcp/protocol` package

**Files:**
- Create: `packages/protocol/package.json`
- Create: `packages/protocol/tsconfig.json`
- Create: `packages/protocol/tsup.config.ts`
- Create: `packages/protocol/src/anthropic-mcp.ts`
- Create: `packages/protocol/src/webmcp.ts`
- Create: `packages/protocol/src/page-mcp.ts`
- Create: `packages/protocol/src/mcp-types.ts`
- Create: `packages/protocol/src/index.ts`
- Create: `packages/protocol/README.md`
- Create: `packages/protocol/test/protocol-exports.test.ts`

**Step 1: Write the failing test**

Use the new export-boundary tests from Task 1 as the red state.

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @page-mcp/protocol exec vitest run test/protocol-exports.test.ts`
Expected: FAIL because the package does not exist yet

**Step 3: Write minimal implementation**

Create the package and move in:
- pure protocol types
- pure protocol constants
- no runtime classes or helpers

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @page-mcp/protocol exec vitest run test/protocol-exports.test.ts`
Expected: PASS

### Task 3: Rewire `@page-mcp/core` to consume the protocol package

**Files:**
- Modify: `packages/core/package.json`
- Modify: `packages/core/src/host.ts`
- Modify: `packages/core/src/client.ts`
- Modify: `packages/core/src/types.ts`
- Modify: `packages/core/src/index.ts`
- Delete or stop exporting: `packages/core/src/anthropic-mcp.ts`
- Delete or stop exporting: `packages/core/src/webmcp.ts`
- Delete or stop exporting: `packages/core/src/page-mcp.ts`
- Delete or stop exporting: `packages/core/src/mcp-types.ts`

**Step 1: Write the failing test**

Use the updated `core` export/type tests as the red state.

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @page-mcp/core exec vitest run test/core-exports.test.ts`
Expected: FAIL

Run: `pnpm --filter @page-mcp/core run typecheck`
Expected: FAIL

**Step 3: Write minimal implementation**

Update `core` so:
- runtime code imports protocol types/constants from `@page-mcp/protocol`
- `core` no longer publicly exports protocol types/constants
- runtime exports stay intact

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @page-mcp/core exec vitest run test/core-exports.test.ts`
Expected: PASS

Run: `pnpm --filter @page-mcp/core run typecheck`
Expected: PASS

### Task 4: Update workspace consumers and docs

**Files:**
- Modify: `packages/webmcp-adapter/package.json`
- Modify: `packages/core/README.md`
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Create: `docs/migration/protocol-package-split.md`

**Step 1: Write the failing test**

No additional automated test required beyond package build/typecheck validation.

**Step 2: Write minimal implementation**

Document:
- what moved to `@page-mcp/protocol`
- what remains in `@page-mcp/core`
- how imports change
- that this is a breaking package-boundary change

Update package dependencies only where required by actual imports.

**Step 3: Verify manually**

Review docs and package manifests for consistency with the final package boundary.

### Task 5: Run final verification

**Files:**
- No code changes

**Step 1: Run protocol package tests**

Run: `pnpm --filter @page-mcp/protocol exec vitest run`
Expected: PASS

**Step 2: Run protocol package typecheck**

Run: `pnpm --filter @page-mcp/protocol run typecheck`
Expected: PASS

**Step 3: Run core package tests**

Run: `pnpm --filter @page-mcp/core exec vitest run`
Expected: PASS

**Step 4: Run core package typecheck**

Run: `pnpm --filter @page-mcp/core run typecheck`
Expected: PASS

**Step 5: Review diff**

Run: `git diff -- packages/protocol packages/core packages/webmcp-adapter README.md README.zh-CN.md docs/migration/protocol-package-split.md docs/plans/2026-03-10-protocol-package-design.md docs/plans/2026-03-10-protocol-package-implementation.md`
Expected: only protocol-split changes and matching docs updates
