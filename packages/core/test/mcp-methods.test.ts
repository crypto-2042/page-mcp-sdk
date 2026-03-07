import { describe, expect, test } from 'vitest';
import { MCP_METHODS } from '../src/mcp-types.js';

describe('MCP method surface', () => {
  test('includes standard tools/resources/prompts method names', () => {
    expect(MCP_METHODS).toContain('tools/list');
    expect(MCP_METHODS).toContain('tools/call');
    expect(MCP_METHODS).toContain('resources/list');
    expect(MCP_METHODS).toContain('resources/read');
    expect(MCP_METHODS).toContain('prompts/list');
    expect(MCP_METHODS).toContain('prompts/get');
  });

  test('includes standard list changed notifications', () => {
    expect(MCP_METHODS).toContain('notifications/tools/list_changed');
    expect(MCP_METHODS).toContain('notifications/resources/list_changed');
    expect(MCP_METHODS).toContain('notifications/prompts/list_changed');
  });
});
