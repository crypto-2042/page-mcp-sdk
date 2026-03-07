import { describe, expect, test } from 'vitest';
import { EventBus } from '../src/transport.js';
import { PageMcpHost } from '../src/host.js';
import { PageMcpClient } from '../src/client.js';
import type { ITransport, RpcMethod, RpcRequest, RpcResponse } from '../src/types.js';

describe('MCP initialize handshake', () => {
  test('host supports initialize and client.connect uses initialize result', async () => {
    const bus = new EventBus();
    const host = new PageMcpHost({ name: 'test-host', version: '2.0.0', bus });
    host.start();

    const init = await bus.request('initialize', {
      protocolVersion: '2025-11-05',
      capabilities: {},
      clientInfo: { name: 'test-client', version: '1.0.0' },
    });

    expect(init.error).toBeUndefined();
    expect(init.result).toMatchObject({
      protocolVersion: '2025-11-05',
      capabilities: {
        tools: { listChanged: true },
        resources: { listChanged: true },
        prompts: { listChanged: true },
        extensions: {
          skills: {
            version: '1.0.0',
            execute: true,
            scriptExecution: 'disabled',
          },
        },
      },
      serverInfo: {
        name: 'test-host',
        version: '2.0.0',
      },
    });

    const client = new PageMcpClient({ bus });
    const connected = await client.connect();
    expect(connected).toMatchObject({ name: 'test-host', version: '2.0.0' });
  });

  test('client.connect falls back to getHostInfo when initialize is unavailable', async () => {
    const bus = new EventBus();

    bus.onRequest(async (req) => {
      if (req.method === 'initialize') {
        return {
          id: req.id,
          error: { code: -32601, message: 'Unknown method: initialize' },
        };
      }
      if (req.method === 'getHostInfo') {
        return {
          id: req.id,
          result: {
            name: 'legacy-host',
            version: '1.0.0',
          },
        };
      }
      return {
        id: req.id,
        error: { code: -32601, message: `Unknown method: ${req.method}` },
      };
    });

    const client = new PageMcpClient({ bus });
    const connected = await client.connect();

    expect(connected).toEqual({
      name: 'legacy-host',
      version: '1.0.0',
    });
  });

  test('client.connect does not fallback for non-method-not-found initialize errors', async () => {
    const bus = new EventBus();
    let getHostInfoCalled = false;

    bus.onRequest(async (req) => {
      if (req.method === 'initialize') {
        return {
          id: req.id,
          error: { code: -32603, message: 'initialize failed' },
        };
      }
      if (req.method === 'getHostInfo') {
        getHostInfoCalled = true;
      }
      return {
        id: req.id,
        error: { code: -32601, message: `Unknown method: ${req.method}` },
      };
    });

    const client = new PageMcpClient({ bus, connectTimeout: 100 });
    await expect(client.connect()).rejects.toThrow('Connection failed: initialize failed');
    expect(getHostInfoCalled).toBe(false);
  });

  test('client.connect respects connectTimeout', async () => {
    class HangingTransport implements ITransport {
      request(_method: RpcMethod, _params?: Record<string, unknown>): Promise<RpcResponse> {
        return new Promise<RpcResponse>(() => undefined);
      }
      onRequest(_handler: (request: RpcRequest) => Promise<RpcResponse>): void {}
      on(_event: string, _callback: (data: unknown) => void): void {}
      off(_event: string, _callback: (data: unknown) => void): void {}
      emit(_event: string, _data?: unknown): void {}
      destroy(): void {}
    }

    const client = new PageMcpClient({ transport: new HangingTransport(), connectTimeout: 30 });
    await expect(client.connect()).rejects.toThrow('Connection timeout');
  });
});
