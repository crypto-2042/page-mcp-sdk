import { describe, expect, test } from 'vitest';
import * as protocol from '../src/index.js';

describe('Protocol exports boundary', () => {
  test('exports protocol constants and no runtime implementation classes', () => {
    expect((protocol as Record<string, unknown>).MCP_METHODS).toBeDefined();
    expect((protocol as Record<string, unknown>).PageMcpHost).toBeUndefined();
    expect((protocol as Record<string, unknown>).PageMcpClient).toBeUndefined();
  });
});
