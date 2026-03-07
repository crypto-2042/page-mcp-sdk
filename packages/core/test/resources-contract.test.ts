import { describe, expect, test } from 'vitest';
import { EventBus } from '../src/transport.js';
import { PageMcpHost } from '../src/host.js';
import { PageMcpClient } from '../src/client.js';

describe('Resources contract', () => {
  test('resources/list and resources/read follow MCP-like shape', async () => {
    const bus = new EventBus();
    const host = new PageMcpHost({ name: 'test', version: '1.0.0', bus });

    host.registerResource({
      uri: 'page://catalog',
      name: 'Catalog',
      description: 'Product catalog',
      mimeType: 'application/json',
      handler: async () => ({
        contents: [
          {
            uri: 'page://catalog',
            mimeType: 'application/json',
            text: JSON.stringify({ items: [{ id: 'sku_1' }] }),
          },
        ],
      }),
    });

    host.start();

    const listResponse = await bus.request('resources/list');
    expect(listResponse.error).toBeUndefined();
    const listPayload = listResponse.result as { items: Array<Record<string, unknown>>; nextCursor?: string };
    expect(listPayload.items[0]).toMatchObject({
      uri: 'page://catalog',
      name: 'Catalog',
      mimeType: 'application/json',
    });
    expect(listPayload.nextCursor).toBeUndefined();

    const readResponse = await bus.request('resources/read', { uri: 'page://catalog' });
    expect(readResponse.error).toBeUndefined();
    expect(readResponse.result).toEqual({
      contents: [
        {
          uri: 'page://catalog',
          mimeType: 'application/json',
          text: JSON.stringify({ items: [{ id: 'sku_1' }] }),
        },
      ],
    });

    const client = new PageMcpClient({ bus });
    await client.connect();
    const readViaClient = await client.readResource('page://catalog');
    expect(readViaClient).toEqual(readResponse.result);
  });
});
