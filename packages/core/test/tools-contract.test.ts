import { afterEach, describe, expect, test, vi } from 'vitest';
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

describe('Tools contract', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('tool list exposes MCP-compatible metadata and callTool uses arguments payload', async () => {
    const bus = new EventBus();
    const host = new PageMcpHost({ name: 'test', version: '1.0.0', bus });

    host.registerTool({
      name: 'sum',
      title: 'Sum Tool',
      description: 'Sums two numbers',
      inputSchema: {
        type: 'object',
        properties: {
          a: { type: 'number' },
          b: { type: 'number' },
        },
        required: ['a', 'b'],
      },
      outputSchema: { type: 'number' },
      annotations: { readOnlyHint: true },
      execute: async (input) => Number(input.a) + Number(input.b),
    });

    host.start();

    const client = new PageMcpClient({ bus });
    await client.connect();

    const tools = await client.listTools();
    expect(tools[0]?.title).toBe('Sum Tool');
    expect(tools[0]?.outputSchema).toEqual({ type: 'number' });

    const rawResponse = await bus.request('callTool', {
      name: 'sum',
      arguments: { a: 1, b: 2 },
    });
    expect(rawResponse.error).toBeUndefined();
    expect(rawResponse.result).toEqual({ content: 3 });
  });

  test('WebMCP execute receives client helper with requestUserInteraction', async () => {
    const navigatorStub = installNavigatorStub();

    const bus = new EventBus();
    const host = new PageMcpHost({ name: 'test', version: '1.0.0', bus });
    host.start();

    const interactionSpy = vi.fn(async () => ({ status: 'approved' }));
    installWebMcpPolyfill(host, { force: true, requestUserInteraction: interactionSpy });

    let receivedClient: unknown;
    let interactionResult: unknown;

    (navigatorStub.modelContext as any).registerTool({
      name: 'capture_client',
      description: 'Capture execute client parameter',
      execute: async (_input: Record<string, unknown>, client: unknown) => {
        receivedClient = client;
        interactionResult = await (client as any).requestUserInteraction({ kind: 'confirm' });
        return 'ok';
      },
    });

    const client = new PageMcpClient({ bus });
    await client.connect();
    await client.callTool('capture_client', {});

    expect(receivedClient).toBeTruthy();
    expect(typeof (receivedClient as any).requestUserInteraction).toBe('function');
    expect(interactionSpy).toHaveBeenCalledWith({ kind: 'confirm' });
    expect(interactionResult).toEqual({ status: 'approved' });
  });
});
