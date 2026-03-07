# WebMCP + MCP Compatibility Overhaul Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor the SDK in one breaking release to align WebMCP behavior and MCP protocol surfaces for tools/resources/prompts, with explicit compatibility boundaries and protocol tests.

**Architecture:** Split protocol concerns into a strict MCP core surface plus a WebMCP browser adapter. Replace legacy RPC method names and data shapes with MCP-standard methods and payloads. Keep non-standard capabilities (skills/chat affordances) as explicit extensions separated from the standard protocol interfaces.

**Tech Stack:** TypeScript, pnpm workspace, tsup, Vitest (new), existing transport layer (EventBus/PostMessage/ChromeRuntime)

---

### Task 1: Establish test harness and protocol fixture structure

**Files:**
- Create: `packages/core/vitest.config.ts`
- Create: `packages/core/test/setup.ts`
- Create: `packages/core/test/fixtures/mcp-tools.json`
- Create: `packages/core/test/fixtures/mcp-resources.json`
- Create: `packages/core/test/fixtures/mcp-prompts.json`
- Modify: `packages/core/package.json`

**Step 1: Add Vitest dev dependency and scripts in core package**

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "vitest": "^2.1.9"
  }
}
```

**Step 2: Add base Vitest config**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.test.ts'],
    coverage: { reporter: ['text', 'html'] },
  },
});
```

**Step 3: Add reusable fixture JSON files for expected MCP responses**

Use fixture files for canonical `tools/list`, `resources/list`, and `prompts/list|get` response snapshots.

**Step 4: Run tests to verify harness is wired**

Run: `pnpm --filter @page-mcp/core test`
Expected: FAIL with "No test files found" or similar baseline failure.

**Step 5: Commit**

```bash
git add packages/core/package.json packages/core/vitest.config.ts packages/core/test
git commit -m "test(core): add vitest harness and protocol fixtures"
```

### Task 2: Replace legacy protocol type system with MCP-standard method names and payloads

**Files:**
- Modify: `packages/core/src/types.ts`
- Modify: `packages/core/src/index.ts`
- Create: `packages/core/src/mcp-types.ts`

**Step 1: Write failing type-level/runtime test for method names**

Create `packages/core/test/mcp-methods.test.ts` asserting allowed methods include:
- `tools/list`, `tools/call`
- `resources/list`, `resources/read`
- `prompts/list`, `prompts/get`
- `notifications/tools/list_changed` (event pathway)

**Step 2: Run test to verify failure against current legacy names**

Run: `pnpm --filter @page-mcp/core test -- test/mcp-methods.test.ts`
Expected: FAIL due to legacy `listTools/callTool/...` still present.

**Step 3: Introduce MCP-native type module**

Define canonical request/response interfaces and method union in `mcp-types.ts`, including:
- pagination cursor request/response envelopes
- structured JSON-RPC error shape
- tool/resource/prompt schemas aligned with MCP docs

**Step 4: Switch exports to MCP-native types and deprecate/remove legacy types**

Update `index.ts` and `types.ts` to either re-export MCP-native types or become wrappers.

**Step 5: Run targeted test**

Run: `pnpm --filter @page-mcp/core test -- test/mcp-methods.test.ts`
Expected: PASS.

**Step 6: Commit**

```bash
git add packages/core/src/types.ts packages/core/src/mcp-types.ts packages/core/src/index.ts packages/core/test/mcp-methods.test.ts
git commit -m "refactor(core): adopt MCP-native protocol method and payload types"
```

### Task 3: Upgrade Tool definitions and execution contract to MCP/WebMCP requirements

**Files:**
- Modify: `packages/core/src/types.ts`
- Modify: `packages/core/src/host.ts`
- Modify: `packages/core/src/client.ts`
- Modify: `packages/core/src/polyfill.ts`
- Create: `packages/core/test/tools-contract.test.ts`

**Step 1: Write failing tests for tool schema and call payload shape**

Assertions:
- tool list entries include `name`, optional `title`, `description`, `inputSchema`, `outputSchema`, `annotations`
- tool call expects `arguments`, not `args`
- tool call returns MCP-compatible structured result payload

**Step 2: Write failing test for WebMCP execute second parameter**

Assert `navigator.modelContext.registerTool({ execute })` receives a second argument exposing `requestUserInteraction`.

**Step 3: Implement tool schema additions and payload migration**

Add `title`, `outputSchema`, optional `securitySchemes` (if adopted in final schema set) to tool definitions and list responses. Update host/client call path to use `arguments`.

**Step 4: Implement `ModelContextClient` bridge in polyfill**

Polyfill must pass `{ requestUserInteraction }` into tool execute callback and wire behavior through host transport.

**Step 5: Run tests**

Run: `pnpm --filter @page-mcp/core test -- test/tools-contract.test.ts`
Expected: PASS.

**Step 6: Commit**

```bash
git add packages/core/src/types.ts packages/core/src/host.ts packages/core/src/client.ts packages/core/src/polyfill.ts packages/core/test/tools-contract.test.ts
git commit -m "feat(core): align tools contract with MCP and WebMCP execute client"
```

### Task 4: Fix unregister/clear semantics and lifecycle correctness

**Files:**
- Modify: `packages/core/src/host.ts`
- Modify: `packages/core/src/polyfill.ts`
- Create: `packages/core/test/tool-lifecycle.test.ts`

**Step 1: Write failing tests for lifecycle behavior**

Assertions:
- `unregisterTool(name)` removes tool from both polyfill registry and host callable set
- `clearContext()` removes all previously bridged tools from host
- removed tools are absent in `tools/list` and fail in `tools/call`

**Step 2: Add host-level unregister APIs**

Implement internal and public removal APIs (`unregisterTool`, optional bulk clear helper) with deterministic behavior.

**Step 3: Wire polyfill lifecycle calls to host**

Track which tools were installed via polyfill and remove matching host registrations on clear/unregister.

**Step 4: Run tests**

Run: `pnpm --filter @page-mcp/core test -- test/tool-lifecycle.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add packages/core/src/host.ts packages/core/src/polyfill.ts packages/core/test/tool-lifecycle.test.ts
git commit -m "fix(core): make WebMCP unregister and clear semantics authoritative"
```

### Task 5: Rebuild Resources API to MCP-standard list/read shapes

**Files:**
- Modify: `packages/core/src/types.ts`
- Modify: `packages/core/src/host.ts`
- Modify: `packages/core/src/client.ts`
- Create: `packages/core/test/resources-contract.test.ts`

**Step 1: Write failing tests for resources schema**

Assertions:
- `resources/list` returns MCP resource descriptors
- `resources/read` returns `{ contents: [...] }`
- each content item includes `uri`, `mimeType`, and `text` or `blob`

**Step 2: Replace legacy `ResourceDefinition.handler -> unknown` contract**

Adopt MCP-compatible resource read result structure with explicit content objects.

**Step 3: Update host/client handlers to new methods and envelopes**

Move from `listResources/readResource` to `resources/list` and `resources/read` method handling.

**Step 4: Run tests**

Run: `pnpm --filter @page-mcp/core test -- test/resources-contract.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add packages/core/src/types.ts packages/core/src/host.ts packages/core/src/client.ts packages/core/test/resources-contract.test.ts
git commit -m "refactor(core): align resources list/read with MCP schema"
```

### Task 6: Rebuild Prompts API to MCP-standard list/get behavior

**Files:**
- Modify: `packages/core/src/types.ts`
- Modify: `packages/core/src/host.ts`
- Modify: `packages/core/src/client.ts`
- Create: `packages/core/test/prompts-contract.test.ts`

**Step 1: Write failing tests for prompt template behavior**

Assertions:
- `prompts/list` includes `name`, `description`, `arguments`
- `prompts/get` returns templated `messages[]`
- runtime argument interpolation follows defined argument schema

**Step 2: Replace legacy prompt card shape**

Migrate from `{ title, icon, prompt }` to MCP prompt template definition and response model.

**Step 3: Implement `prompts/get` host and client methods**

Add method routing and client helper for fetching prompt messages by name + args.

**Step 4: Run tests**

Run: `pnpm --filter @page-mcp/core test -- test/prompts-contract.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add packages/core/src/types.ts packages/core/src/host.ts packages/core/src/client.ts packages/core/test/prompts-contract.test.ts
git commit -m "refactor(core): implement MCP prompts list/get contracts"
```

### Task 7: Add capabilities, pagination, and list-changed notifications

**Files:**
- Modify: `packages/core/src/types.ts`
- Modify: `packages/core/src/host.ts`
- Modify: `packages/core/src/client.ts`
- Modify: `packages/core/src/transport.ts`
- Create: `packages/core/test/capabilities-and-pagination.test.ts`

**Step 1: Write failing tests for server capability declaration and cursor pagination**

Assertions:
- host info/initialize payload exposes capabilities for tools/resources/prompts
- list endpoints accept cursor and return nextCursor when paginated

**Step 2: Write failing tests for list changed notifications**

Assertions:
- tool/resource/prompt registry mutation emits corresponding list_changed notification events.

**Step 3: Implement capability advertisement**

Add initialize/getHostInfo extension payload or dedicated initialize method returning capability map.

**Step 4: Implement pagination for list endpoints**

Support cursor inputs and deterministic slicing.

**Step 5: Implement notifications**

Emit and route standard list-changed notifications via transport event channel.

**Step 6: Run tests**

Run: `pnpm --filter @page-mcp/core test -- test/capabilities-and-pagination.test.ts`
Expected: PASS.

**Step 7: Commit**

```bash
git add packages/core/src/types.ts packages/core/src/host.ts packages/core/src/client.ts packages/core/src/transport.ts packages/core/test/capabilities-and-pagination.test.ts
git commit -m "feat(core): add MCP capabilities pagination and list-changed notifications"
```

### Task 8: Introduce dedicated WebMCP adapter package

**Files:**
- Create: `packages/webmcp-adapter/package.json`
- Create: `packages/webmcp-adapter/tsconfig.json`
- Create: `packages/webmcp-adapter/tsup.config.ts`
- Create: `packages/webmcp-adapter/src/index.ts`
- Move: `packages/core/src/polyfill.ts` -> `packages/webmcp-adapter/src/polyfill.ts`
- Modify: `pnpm-workspace.yaml`
- Modify: `README.md`
- Modify: `packages/core/README.md`

**Step 1: Write failing import test in core**

Assert core no longer exports browser-only `navigator.modelContext` polyfill helpers.

**Step 2: Scaffold new package and migrate polyfill code**

Keep WebMCP-specific APIs in adapter package and depend on `@page-mcp/core` types/interfaces.

**Step 3: Re-export adapter APIs from new package only**

Ensure consumers import `installWebMcpPolyfill` from `@page-mcp/webmcp-adapter`.

**Step 4: Run build/typecheck**

Run: `pnpm -r run typecheck && pnpm -r run build`
Expected: PASS for all packages including new adapter.

**Step 5: Commit**

```bash
git add packages/webmcp-adapter pnpm-workspace.yaml README.md packages/core/README.md
git commit -m "refactor: extract WebMCP adapter into dedicated package"
```

### Task 9: Remove/relocate non-standard extensions from standard protocol surface

**Files:**
- Modify: `packages/core/src/host.ts`
- Modify: `packages/core/src/client.ts`
- Modify: `packages/core/src/index.ts`
- Modify: `packages/core/src/types.ts`
- Create: `packages/core/src/extensions/skills.ts`
- Create: `packages/core/test/extensions-boundary.test.ts`

**Step 1: Write failing boundary test**

Assertions:
- standard client/server API surface does not expose non-MCP methods by default
- extension APIs are namespaced and opt-in

**Step 2: Move skills APIs behind extension module**

Preserve functionality but prevent confusion with standard MCP method namespace.

**Step 3: Update exports**

Core root exports only standard protocol entities; extension exports are explicit.

**Step 4: Run tests**

Run: `pnpm --filter @page-mcp/core test -- test/extensions-boundary.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add packages/core/src/host.ts packages/core/src/client.ts packages/core/src/index.ts packages/core/src/types.ts packages/core/src/extensions/skills.ts packages/core/test/extensions-boundary.test.ts
git commit -m "refactor(core): isolate non-standard extensions behind explicit namespace"
```

### Task 10: Rewrite docs and migration guide for breaking v2

**Files:**
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `packages/core/README.md`
- Create: `docs/migration/v1-to-v2.md`
- Create: `docs/compatibility-matrix.md`

**Step 1: Replace compatibility claims with explicit matrix**

Document WebMCP compatibility scope and MCP method-level coverage.

**Step 2: Add breaking change migration map**

Include old-to-new method and type mapping table with examples.

**Step 3: Update all code snippets to new APIs**

Ensure no snippet references removed methods (`listTools/callTool/...`).

**Step 4: Run docs sanity checks via grep**

Run: `rg -n "listTools|callTool|listResources|readResource|listPrompts|executeSkill" README.md README.zh-CN.md packages/core/README.md docs`
Expected: only intentional mentions in migration guide.

**Step 5: Commit**

```bash
git add README.md README.zh-CN.md packages/core/README.md docs/migration/v1-to-v2.md docs/compatibility-matrix.md
git commit -m "docs: publish v2 migration guide and standards compatibility matrix"
```

### Task 11: End-to-end verification and release readiness checks

**Files:**
- Modify: `package.json`
- Create: `scripts/verify-v2.sh`
- Create: `docs/release-checklist-v2.md`

**Step 1: Add workspace test script**

Add root script:

```json
{
  "scripts": {
    "test": "pnpm -r run test"
  }
}
```

**Step 2: Add verification script**

`verify-v2.sh` runs:
- `pnpm install`
- `pnpm -r run typecheck`
- `pnpm -r run test`
- `pnpm -r run build`

**Step 3: Run full verification**

Run: `bash scripts/verify-v2.sh`
Expected: all commands succeed.

**Step 4: Capture release checklist**

Document version bumps, changelog entries, and publish order.

**Step 5: Commit**

```bash
git add package.json scripts/verify-v2.sh docs/release-checklist-v2.md
git commit -m "chore: add v2 verification pipeline and release checklist"
```

### Task 12: Final compatibility evidence pack

**Files:**
- Create: `docs/evidence/webmcp-compat.md`
- Create: `docs/evidence/mcp-compat.md`
- Create: `docs/evidence/test-report.md`

**Step 1: Generate test output artifacts**

Run: `pnpm --filter @page-mcp/core test -- --reporter=verbose > /tmp/page-mcp-core-test-report.txt`
Expected: output file contains all passing suites.

**Step 2: Summarize evidence by spec clause**

Map each required behavior to test case names and file paths.

**Step 3: Commit evidence docs**

```bash
git add docs/evidence/webmcp-compat.md docs/evidence/mcp-compat.md docs/evidence/test-report.md
git commit -m "docs: add protocol compatibility evidence pack"
```

## Definition of Done

- All legacy non-standard RPC method names removed from default protocol surface.
- Tools/resources/prompts contracts match MCP method names and payload structures.
- WebMCP adapter supports execute second argument and interaction requests.
- Lifecycle semantics (`unregisterTool`, `clearContext`) are authoritative and test-covered.
- Protocol test suite passes in CI-equivalent local run.
- Docs include compatibility matrix + v1->v2 migration guide + evidence mapping.
