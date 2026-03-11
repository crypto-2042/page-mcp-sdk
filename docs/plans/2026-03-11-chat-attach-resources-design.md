# Chat Attach Resources Design

## Goal

Add an explicit resource attachment flow to `@page-mcp/chat` that stays aligned with MCP semantics:

- resources remain application-controlled
- users can explicitly choose which resources to attach
- attached resource content is added to the current conversation turn as explicit context

This change should not reintroduce automatic resource injection into the model.

## Why This Is Needed

After aligning `@page-mcp/chat` with MCP semantics, resources are no longer injected into model-facing system messages by default.

That is correct semantically, but it also means there is currently no first-class way for a user to say:

- include the current cart summary
- include the visible product list
- include another page resource in this conversation

So the missing capability is not automatic resource exposure, but explicit resource attachment.

## Recommended Scope

Implement a narrow first version:

1. Add an `Attach Resources` UI control.
2. Let users select one or more available resources.
3. Persist selected resources in widget state.
4. On send, read the selected resources and inject their content into the current turn as explicit application-provided context.
5. Keep selections until the user changes them.
6. Add a config field for future evolution:
   - `defaultAttachedResources?: string[]`

This provides immediate utility without introducing auto-attachment heuristics.

## Interaction Model

### Resource Selection

- the chat panel exposes an `Attach Resources` control near the input area
- clicking it reveals a lightweight resource list panel
- each resource shows:
  - `name`
  - `description`
  - `mimeType`
- resources can be selected or deselected with a checkbox

### Attachment State

- selected resources remain selected across sends
- the attach button should reflect the selected count
- resources are not sent until the user actually sends a message

### Message Send

When the user sends a message:

1. the engine reads the currently selected resources
2. the engine converts the read results into an attachment block
3. the attachment block is inserted into the outgoing model-facing message list for that turn
4. the user message follows as normal

This preserves the distinction:

- the application decides which resources are attached
- the model consumes the attached content, but does not discover or choose resources on its own

## Attachment Format

Keep the attachment format text-based and simple.

Recommended per-turn message shape:

```text
Attached page resources for this conversation turn:

[Visible Product Names]
{"content":["Wireless Headphones","Mechanical Keyboard"]}

[Cart Summary Text]
$89.99
```

Implementation guidance:

- use a single injected `system` message immediately before the user message for the current send
- build the text from the results of `resources/read`
- prefer resource `text` content when available
- if multiple resource contents are returned, include each in sequence

This is intentionally simple and compatible with the existing request builder.

## Future Evolution

This first version should explicitly prepare for later stages without implementing them yet.

### Default Attached Resources

Add `defaultAttachedResources?: string[]` to config.

Meaning:

- these resource URIs are preselected when the widget initializes
- they are still application-configured, not model-controlled

### Later Possibilities

Not part of this task, but the design should not block:

- per-turn temporary attachment
- attached resource preview
- host-defined attachment strategies
- resource chips in the composer area

## Testing Strategy

Use TDD and cover both engine behavior and selection semantics.

Tests should verify:

- selected resources are read before send
- attached resource content appears in the outgoing request messages
- no resources are attached when nothing is selected
- default attached resources are preselected from config
- prompt/tool semantics remain unchanged

If the first version keeps UI tests light, extract small pure helpers so the selection and formatting rules are still directly testable.
