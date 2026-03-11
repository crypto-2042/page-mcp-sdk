import { describe, expect, test } from 'vitest';
import { EventBus } from '../src/transport.js';
import { PageMcpHost } from '../src/host.js';
import { PageMcpClient } from '../src/client.js';

describe('Resources contract', () => {
  test('resources/list and resources/read follow MCP-like shape for declaration-only resources', async () => {
    const documentStub = {
      querySelectorAll: (selector: string) => {
        if (selector !== '.catalog') {
          return [];
        }
        return [
          {
            textContent: '{"items":[{"id":"sku_1"}]}',
            outerHTML: '<div class="catalog">{"items":[{"id":"sku_1"}]}</div>',
            children: [],
          },
        ];
      },
    };

    Object.defineProperty(globalThis, 'document', {
      value: documentStub,
      configurable: true,
      writable: true,
    });

    const bus = new EventBus();
    const host = new PageMcpHost({ name: 'test', version: '1.0.0', bus });

    host.registerResource({
      uri: 'page://selector/.catalog',
      name: 'Catalog',
      description: 'Product catalog',
      mimeType: 'application/json',
    });

    host.start();

    const listResponse = await bus.request('resources/list');
    expect(listResponse.error).toBeUndefined();
    const listPayload = listResponse.result as { items: Array<Record<string, unknown>>; nextCursor?: string };
    expect(listPayload.items[0]).toMatchObject({
      uri: 'page://selector/.catalog',
      name: 'Catalog',
      mimeType: 'application/json',
    });
    expect(listPayload.nextCursor).toBeUndefined();

    const readResponse = await bus.request('resources/read', { uri: 'page://selector/.catalog' });
    expect(readResponse.error).toBeUndefined();
    expect(readResponse.result).toEqual({
      contents: [
        {
          uri: 'page://selector/.catalog',
          mimeType: 'application/json',
          text: JSON.stringify({ content: ['{"items":[{"id":"sku_1"}]}'] }),
        },
      ],
    });

    const client = new PageMcpClient({ bus });
    await client.connect();
    const readViaClient = await client.readResource('page://selector/.catalog');
    expect(readViaClient).toEqual(readResponse.result);
  });
});
