# Chat MCP Semantics Design

## Goal

Align `@page-mcp/chat` with MCP primitive semantics:

- tools are model-controlled
- resources are application-controlled
- prompts are user-controlled

The default behavior of the chat package should reflect that distinction instead of treating all discovered MCP primitives as generic model context.

## Current Problem

The current `chat` implementation mixes the three MCP primitive types:

- tools are correctly passed to the model through the OpenAI `tools` field
- prompts are also rendered as UI shortcut cards
- resources and prompts were being described to the model through extra system messages

This blurs MCP semantics:

- prompts become implicit model context instead of explicit user choice
- resources become implicit model context instead of application-controlled context

It also creates confusing behavior:

- if tools are absent, the model can lose most MCP-related context
- parameterized prompts appear discoverable by the UI even when they cannot be safely invoked without more user input

## Target Semantics

`@page-mcp/chat` should follow these defaults:

### Tools

- tools remain discoverable by the chat engine
- tools continue to be passed to the model via the OpenAI `tools` field
- this is the only MCP primitive automatically exposed to the model by default

### Prompts

- prompts remain discoverable by the chat UI
- prompts are not injected into system messages by default
- prompts are user-invoked UI affordances, not implicit model background knowledge
- only prompts that can be safely invoked without required arguments should appear as default prompt shortcut cards

### Resources

- resources may still be discovered by the client
- resources are not injected into system messages by default
- resources are not auto-read and attached to the model by default
- explicit resource selection or resource attachment UI can be added later, but is out of scope for this change

## Recommended Approach

Use strict MCP defaults now, with no compatibility flag in this task.

This means:

1. Remove default resource and prompt system-message injection from `ChatEngine`.
2. Keep model tool exposure exactly as it is today.
3. Filter prompt cards so only prompts without required arguments are rendered by default.
4. Keep internal prompt discovery intact for future UI extension.

This is the smallest change that restores correct semantics without adding new product surface.

## Prompt Shortcut Rules

The prompt shortcut UI should use this rule:

- show prompts with no arguments
- show prompts whose arguments exist but none are marked `required`
- do not show prompts with one or more required arguments

Reason:

- clicking a prompt card should remain a valid user action
- the default chat UI should not invent prompt arguments
- collecting required prompt arguments needs a dedicated UI flow, which is not part of this task

## Data Flow After Change

1. `ChatEngine.init()`
   - connect to MCP
   - discover tools
   - discover prompts
   - resource discovery can remain available internally, but does not affect model context

2. `ChatEngine.sendMessage()`
   - build system prompt
   - add conversation history
   - pass tools via API `tools`
   - do not append resource/prompt discovery messages by default

3. `ChatWidget.renderPromptCards()`
   - read discovered prompts from the engine
   - filter out prompts with required arguments
   - show only directly invokable shortcuts

## Testing Strategy

Use TDD and cover the semantic boundary explicitly.

Tests should verify:

- resources and prompts are not injected into the AI request body as system messages
- tools continue to be passed to the API `tools` field
- prompt cards only include prompts that do not require arguments
- prompts with required arguments are excluded from default shortcut rendering

The key is to lock the MCP semantic split, not just the current implementation details.
