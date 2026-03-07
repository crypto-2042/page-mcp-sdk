import { describe, expect, test } from 'vitest';
import { EventBus } from '../src/transport.js';
import { PageMcpHost } from '../src/host.js';
import { PageMcpClient } from '../src/client.js';
import { installWebMcpPolyfill } from '../../webmcp-adapter/src/index.js';

function installNavigatorStub() {
  const value: Record<string, unknown> = {};
  Object.defineProperty(globalThis, 'navigator', {
    value,
    configurable: true,
    writable: true,
  });
  return value;
}

describe('WebMCP lifecycle semantics', () => {
  test('unregisterTool removes polyfilled tool from host registry', async () => {
    const navigatorStub = installNavigatorStub();
    const bus = new EventBus();
    const host = new PageMcpHost({ name: 'test', version: '1.0.0', bus });
    host.start();

    installWebMcpPolyfill(host, { force: true });

    (navigatorStub.modelContext as any).registerTool({
      name: 'temp_tool',
      description: 'Temporary tool',
      execute: async () => 'ok',
    });

    const client = new PageMcpClient({ bus });
    await client.connect();

    const before = await client.listTools();
    expect(before.map((tool) => tool.name)).toContain('temp_tool');

    (navigatorStub.modelContext as any).unregisterTool('temp_tool');

    const after = await client.listTools();
    expect(after.map((tool) => tool.name)).not.toContain('temp_tool');

    await expect(client.callTool('temp_tool', {})).rejects.toThrow('Tool not found');
  });

  test('clearContext removes all polyfilled tools from host registry', async () => {
    const navigatorStub = installNavigatorStub();
    const bus = new EventBus();
    const host = new PageMcpHost({ name: 'test', version: '1.0.0', bus });
    host.start();

    installWebMcpPolyfill(host, { force: true });

    (navigatorStub.modelContext as any).registerTool({
      name: 'temp_a',
      description: 'Temporary A',
      execute: async () => 'a',
    });
    (navigatorStub.modelContext as any).registerTool({
      name: 'temp_b',
      description: 'Temporary B',
      execute: async () => 'b',
    });

    const client = new PageMcpClient({ bus });
    await client.connect();

    expect((await client.listTools()).map((tool) => tool.name)).toEqual(
      expect.arrayContaining(['temp_a', 'temp_b'])
    );

    (navigatorStub.modelContext as any).clearContext();

    const after = await client.listTools();
    expect(after.map((tool) => tool.name)).not.toContain('temp_a');
    expect(after.map((tool) => tool.name)).not.toContain('temp_b');
  });
});
