import { describe, expect, test } from 'vitest';
import * as core from '../src/index.js';

describe('Core exports boundary', () => {
  test('core no longer exports WebMCP browser adapter helpers', () => {
    expect((core as Record<string, unknown>).installWebMcpPolyfill).toBeUndefined();
    expect((core as Record<string, unknown>).isWebMcpSupported).toBeUndefined();
    expect((core as Record<string, unknown>).toWebMcpTool).toBeUndefined();
    expect((core as Record<string, unknown>).fromWebMcpTool).toBeUndefined();
  });
});
