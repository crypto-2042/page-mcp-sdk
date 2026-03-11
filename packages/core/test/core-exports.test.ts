import { describe, expect, test } from 'vitest';
import * as core from '../src/index.js';

describe('Core exports boundary', () => {
  test('core no longer exports WebMCP browser adapter helpers', () => {
    expect((core as Record<string, unknown>).installWebMcpPolyfill).toBeUndefined();
    expect((core as Record<string, unknown>).isWebMcpSupported).toBeUndefined();
    expect((core as Record<string, unknown>).toWebMcpTool).toBeUndefined();
    expect((core as Record<string, unknown>).fromWebMcpTool).toBeUndefined();
  });

  test('core no longer exposes legacy mixed runtime exports', () => {
    expect((core as Record<string, unknown>).PageMcpHost).toBeDefined();
    expect((core as Record<string, unknown>).PageMcpClient).toBeDefined();
    expect((core as Record<string, unknown>).MCP_METHODS).toBeUndefined();
    expect((core as Record<string, unknown>).AnthropicMcpTool).toBeUndefined();
    expect((core as Record<string, unknown>).WebMcpTool).toBeUndefined();
    expect((core as Record<string, unknown>).PageMcpToolDefinition).toBeUndefined();
    expect((core as Record<string, unknown>).ToolDefinition).toBeUndefined();
    expect((core as Record<string, unknown>).PromptDefinition).toBeUndefined();
    expect((core as Record<string, unknown>).ResourceDefinition).toBeUndefined();
    expect((core as Record<string, unknown>).ToolAnnotations).toBeUndefined();
  });
});
