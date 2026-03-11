# Root README Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rewrite the root English and Chinese READMEs so they present Page MCP as a product homepage: what it is, what problem it solves, and how to start using it.

**Architecture:** Replace the current handbook-style root README with a concise product-entry narrative. Keep a short package overview table for navigation, but move detailed package and framework explanations out of the main flow. Rewrite `README.md` and `README.zh-CN.md` together so they stay structurally aligned while reading naturally in their own language.

**Tech Stack:** Markdown

---

### Task 1: Rewrite the English root README as a product homepage

**Files:**
- Modify: `README.md`

**Step 1: Write the failing test**

No automated test required. Use doc review against the approved structure:
- what Page MCP is
- what problem it solves
- how it works
- quick start
- when to use it
- short package overview

**Step 2: Write minimal implementation**

Rewrite `README.md` around:
- title + value proposition
- what is Page MCP
- what problem it solves
- how it works
- quick start
- when to use it
- short package overview
- learn more links

Compress or remove:
- long API sections
- long framework tutorial sections
- repeated package-level detail

**Step 3: Verify manually**

Review `README.md` and confirm the first screen answers:
- what is this?
- why does it exist?
- how do I start?

### Task 2: Rewrite the Chinese root README with the same structure

**Files:**
- Modify: `README.zh-CN.md`

**Step 1: Write the failing test**

No automated test required. Use doc review against the same approved structure as the English README.

**Step 2: Write minimal implementation**

Rewrite `README.zh-CN.md` with the same sections and meaning:
- what Page MCP is
- what problem it solves
- how it works
- quick start
- when to use it
- short package overview

Write the Chinese copy naturally rather than literally translating sentence by sentence.

**Step 3: Verify manually**

Review `README.zh-CN.md` and confirm it reads as a natural Chinese product homepage, not a mechanical mirror of the English file.

### Task 3: Final consistency review

**Files:**
- Review: `README.md`
- Review: `README.zh-CN.md`
- Reference: `docs/plans/2026-03-10-root-readme-redesign.md`

**Step 1: Consistency review**

Check:
- both files follow the same high-level structure
- package overview remains concise
- root README no longer acts like a full API handbook
- links to package READMEs remain useful entry points

**Step 2: Diff review**

Run: `git diff -- README.md README.zh-CN.md docs/plans/2026-03-10-root-readme-redesign.md docs/plans/2026-03-10-root-readme-redesign-implementation.md`
Expected: only the root README rewrites and their associated design/plan docs
