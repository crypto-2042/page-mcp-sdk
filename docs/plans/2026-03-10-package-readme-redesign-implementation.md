# Package README Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rewrite the package-level READMEs so each package clearly reflects its current primary responsibility, with both English and Chinese versions for every package.

**Architecture:** Treat each package README pair as a focused documentation task. `@page-mcp/core` gets a usage-first rewrite, while the remaining packages get role-first, concise documentation that emphasizes package boundaries, minimal setup, and relationship to adjacent packages. Use the same structure across English and Chinese versions, but write each language naturally instead of mirroring phrasing literally.

**Tech Stack:** Markdown, pnpm workspace package structure

---

### Task 1: Rewrite `@page-mcp/core` English and Chinese READMEs

**Files:**
- Modify: `packages/core/README.md`
- Create: `packages/core/README.zh-CN.md`

**Step 1: Write the failing test**

No automated test required. Use doc review against the approved design:
- `core` must be usage-first
- explain installation, quick start, common patterns, transport choices, and relation to `@page-mcp/protocol`

**Step 2: Write minimal implementation**

Rewrite `packages/core/README.md` around:
- what `core` is
- when to use it
- installation
- quick start
- common patterns
- transport choices
- relationship to other packages

Then write `packages/core/README.zh-CN.md` with the same structure and meaning in natural Chinese.

**Step 3: Verify manually**

Review both files and confirm:
- `core` reads as the main runtime entry package
- examples match current API
- no references to removed old type names remain

### Task 2: Rewrite `@page-mcp/protocol` English and Chinese READMEs

**Files:**
- Modify: `packages/protocol/README.md`
- Create: `packages/protocol/README.zh-CN.md`

**Step 1: Write the failing test**

No automated test required. Use doc review against the approved design:
- protocol-only package
- pure types/constants
- no runtime behavior

**Step 2: Write minimal implementation**

Document:
- package purpose
- when to use it
- what it exports
- what it intentionally does not include
- relationship to `@page-mcp/core`

Write both English and Chinese versions.

**Step 3: Verify manually**

Review both files and confirm the package boundary is obvious from the first screen.

### Task 3: Rewrite `@page-mcp/webmcp-adapter` English and Chinese READMEs

**Files:**
- Modify: `packages/webmcp-adapter/README.md`
- Create: `packages/webmcp-adapter/README.zh-CN.md`

**Step 1: Write the failing test**

No automated test required. Use doc review against the approved design:
- browser adapter scope
- polyfill/bridge role
- relation to `core`

**Step 2: Write minimal implementation**

Document:
- what the adapter does
- when to use it
- installation
- minimal polyfill example
- relation to `core` and `protocol`

Write both English and Chinese versions.

**Step 3: Verify manually**

Review both files and confirm the adapter is clearly described as a browser-facing bridge, not the main runtime package.

### Task 4: Rewrite `@page-mcp/chat` English and Chinese READMEs

**Files:**
- Modify: `packages/chat/README.md`
- Create: `packages/chat/README.zh-CN.md`

**Step 1: Write the failing test**

No automated test required. Use doc review against the approved design:
- product-style package
- embeddable chat UI
- auto-discovery of page capabilities

**Step 2: Write minimal implementation**

Document:
- what the package is
- when to use it
- installation
- minimal embed examples
- direct API mode vs endpoint mode
- relationship to `core`

Write both English and Chinese versions.

**Step 3: Verify manually**

Review both files and confirm the package reads like an embeddable product package rather than a low-level SDK.

### Task 5: Rewrite React/Vue package READMEs in English and Chinese

**Files:**
- Modify: `packages/react/README.md`
- Create: `packages/react/README.zh-CN.md`
- Modify: `packages/vue3/README.md`
- Create: `packages/vue3/README.zh-CN.md`
- Modify: `packages/vue2/README.md`
- Create: `packages/vue2/README.zh-CN.md`

**Step 1: Write the failing test**

No automated test required. Use doc review against the approved design:
- each package should be integration-layer-first
- focus on provider/plugin/hooks/composables/mixin patterns

**Step 2: Write minimal implementation**

For each package, document:
- what this adapter does
- when to use it
- installation
- minimal integration example
- core exports or integration surface
- relationship to `core` and `protocol`

Write both English and Chinese versions for all three adapters.

**Step 3: Verify manually**

Review all six files and confirm each one emphasizes the framework-specific ergonomics rather than repeating the whole SDK manual.

### Task 6: Final documentation review

**Files:**
- Review all package README files under `packages/*`

**Step 1: Consistency review**

Check:
- every package has both `README.md` and `README.zh-CN.md`
- package purpose is obvious in the first screen
- examples use current APIs and current package boundaries
- `core` is usage-first, other packages are role-first

**Step 2: Diff review**

Run: `git diff -- packages/*/README.md packages/*/README.zh-CN.md docs/plans/2026-03-10-package-readme-redesign.md docs/plans/2026-03-10-package-readme-redesign-implementation.md`
Expected: only README rewrites and the associated design/plan docs
