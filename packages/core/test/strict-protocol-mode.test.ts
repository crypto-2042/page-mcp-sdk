import { describe, expect, test } from 'vitest';
import { EventBus } from '../src/transport.js';
import { PageMcpHost } from '../src/host.js';
import { PageMcpClient } from '../src/client.js';

describe('Strict protocol mode', () => {
  test('strict host rejects legacy RPC methods and accepts standard MCP methods', async () => {
    const bus = new EventBus();
    const host = new PageMcpHost({ name: 'strict-host', version: '1.0.0', bus, strictProtocol: true });

    host.registerTool({
      name: 'echo',
      description: 'Echo',
      execute: async (input) => input,
    });

    host.start();

    const legacyList = await bus.request('listTools');
    expect(legacyList.error).toEqual({
      code: -32601,
      message: 'Unknown method: listTools',
    });

    const modernList = await bus.request('tools/list', { cursor: '0', limit: 10 });
    expect(modernList.error).toBeUndefined();
    expect(modernList.result).toEqual({
      items: [expect.objectContaining({ name: 'echo' })],
      nextCursor: undefined,
    });

    const legacyCall = await bus.request('callTool', { name: 'echo', args: { ok: true } });
    expect(legacyCall.error).toEqual({
      code: -32601,
      message: 'Unknown method: callTool',
    });

    const modernCall = await bus.request('tools/call', { name: 'echo', arguments: { ok: true } });
    expect(modernCall.error).toBeUndefined();
    expect(modernCall.result).toEqual({ content: { ok: true } });
  });

  test('client.connect still succeeds against strict host via initialize', async () => {
    const bus = new EventBus();
    const host = new PageMcpHost({ name: 'strict-host', version: '1.0.0', bus, strictProtocol: true });
    host.start();

    const client = new PageMcpClient({ bus });
    const connected = await client.connect();

    expect(connected).toMatchObject({ name: 'strict-host', version: '1.0.0' });
  });

  test('default host still supports legacy compatibility methods', async () => {
    const bus = new EventBus();
    const host = new PageMcpHost({ name: 'compat-host', version: '1.0.0', bus });

    host.registerTool({
      name: 'echo',
      description: 'Echo',
      execute: async (input) => input,
    });

    host.start();

    const legacyList = await bus.request('listTools');
    expect(legacyList.error).toBeUndefined();

    const legacyCall = await bus.request('callTool', { name: 'echo', args: { ok: true } });
    expect(legacyCall.error).toBeUndefined();
    expect(legacyCall.result).toEqual({ content: { ok: true } });
  });
});
