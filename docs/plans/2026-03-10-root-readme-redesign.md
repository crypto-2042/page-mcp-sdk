# Root README Redesign

## Goal

Rewrite the root `README.md` and `README.zh-CN.md` so they act like a product homepage for Page MCP: clearly explaining what Page MCP is, what problem it solves, and how to start using it quickly.

## Design Summary

The root README should no longer behave like a full workspace manual. Instead, it should behave like the entry page for the project:

- define what Page MCP is
- explain why it exists
- show how it works at a high level
- give a minimal quick start
- provide a short package overview as navigation

Detailed package-specific behavior should live in package READMEs.

## Core Narrative

The main message should be:

- Page MCP lets a web page describe its capabilities to AI in a structured way
- instead of forcing agents to infer everything from raw DOM, the page can explicitly expose what can be read and what can be done
- this makes AI integrations more reliable and maintainable than selector-only automation

The Chinese README should carry the same narrative naturally:

- Page MCP 让网页能够以结构化方式向 AI 描述自己的能力
- 不再让 Agent 只靠原始 DOM 猜测页面语义，而是由页面明确暴露“能读什么、能做什么”
- 这比只依赖 selector 的自动化更稳定、更清晰，也更容易维护

## Recommended Structure

1. Title and one-line value proposition
2. What Is Page MCP
3. What Problem It Solves
4. How It Works
5. Quick Start
6. When To Use It
7. Package Overview
8. Learn More

## What To Remove or Compress

The root README should remove or heavily compress:

- long API reference sections
- detailed framework-specific tutorials
- long concept taxonomies
- repeated package-level documentation
- low-level implementation explanations

Those details should link out to package READMEs instead.

## Package Overview Decision

Keep a short package overview table, but use it as navigation rather than as the main body of the documentation.

The table should stay concise:

- package name
- one-line responsibility

## Expected Outcome

After the rewrite:

- a new reader should understand the project from the first screen
- the root README should answer “what is this?” and “why would I use it?”
- the root README should give a minimal path to first use
- detailed package usage should live in package-level READMEs
