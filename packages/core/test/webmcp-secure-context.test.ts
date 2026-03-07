import { describe, expect, test } from 'vitest';
import { installWebMcpPolyfill } from '../../webmcp-adapter/src/index.js';

function setNavigatorStub() {
  const value: Record<string, unknown> = {};
  Object.defineProperty(globalThis, 'navigator', {
    value,
    configurable: true,
    writable: true,
  });
  return value;
}

describe('WebMCP secure-context behavior', () => {
  test('does not install polyfill on insecure context unless force=true', () => {
    const navigatorStub = setNavigatorStub();

    Object.defineProperty(globalThis, 'window', {
      value: { isSecureContext: false },
      configurable: true,
      writable: true,
    });

    installWebMcpPolyfill({
      registerTool: () => undefined,
      unregisterTool: () => undefined,
    });

    expect((navigatorStub as any).modelContext).toBeUndefined();

    installWebMcpPolyfill(
      {
        registerTool: () => undefined,
        unregisterTool: () => undefined,
      },
      { force: true }
    );

    expect((navigatorStub as any).modelContext).toBeDefined();
  });
});
