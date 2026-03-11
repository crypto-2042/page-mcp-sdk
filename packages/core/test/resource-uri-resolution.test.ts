import { afterEach, describe, expect, test } from 'vitest';
import { EventBus } from '../src/transport.js';
import { PageMcpHost } from '../src/host.js';

function makeElement(textContent: string, outerHTML: string, children: Array<{ textContent: string }> = []) {
  return {
    textContent,
    outerHTML,
    children,
  };
}

describe('Resource URI resolution', () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'document');
    Reflect.deleteProperty(globalThis, 'XPathResult');
  });

  test('reads text/plain from the first CSS selector match', async () => {
    Object.defineProperty(globalThis, 'document', {
      value: {
        querySelectorAll: (selector: string) =>
          selector === '.title'
            ? [
                makeElement('Primary title', '<h1 class="title">Primary title</h1>'),
                makeElement('Secondary title', '<h1 class="title">Secondary title</h1>'),
              ]
            : [],
      },
      configurable: true,
      writable: true,
    });

    const bus = new EventBus();
    const host = new PageMcpHost({ name: 'test', version: '1.0.0', bus });
    host.registerResource({
      uri: 'page://selector/.title',
      name: 'Current Title',
      description: 'Visible primary title',
      mimeType: 'text/plain',
    });
    host.start();

    const response = await bus.request('resources/read', { uri: 'page://selector/.title' });
    expect(response.error).toBeUndefined();
    expect(response.result).toEqual({
      contents: [
        {
          uri: 'page://selector/.title',
          mimeType: 'text/plain',
          text: 'Primary title',
        },
      ],
    });
  });

  test('reads text/html from the first XPath match', async () => {
    Object.defineProperty(globalThis, 'XPathResult', {
      value: { ORDERED_NODE_SNAPSHOT_TYPE: 7 },
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, 'document', {
      value: {
        evaluate: (xpath: string) => ({
          snapshotLength: xpath === '//button' ? 2 : 0,
          snapshotItem: (index: number) =>
            index === 0
              ? makeElement('Buy now', '<button>Buy now</button>')
              : makeElement('Wishlist', '<button>Wishlist</button>'),
        }),
      },
      configurable: true,
      writable: true,
    });

    const bus = new EventBus();
    const host = new PageMcpHost({ name: 'test', version: '1.0.0', bus });
    host.registerResource({
      uri: 'page://xpath/%2F%2Fbutton',
      name: 'Primary CTA',
      description: 'First visible button',
      mimeType: 'text/html',
    });
    host.start();

    const response = await bus.request('resources/read', { uri: 'page://xpath/%2F%2Fbutton' });
    expect(response.error).toBeUndefined();
    expect(response.result).toEqual({
      contents: [
        {
          uri: 'page://xpath/%2F%2Fbutton',
          mimeType: 'text/html',
          text: '<button>Buy now</button>',
        },
      ],
    });
  });

  test('reads application/json with fixed content wrapper', async () => {
    Object.defineProperty(globalThis, 'document', {
      value: {
        querySelectorAll: (selector: string) =>
          selector === '.item'
            ? [
                makeElement('Phone $99', '<div class="item">Phone $99</div>', [
                  { textContent: 'Phone' },
                  { textContent: '$99' },
                ]),
                makeElement('Case $19', '<div class="item">Case $19</div>', [
                  { textContent: 'Case' },
                  { textContent: '$19' },
                ]),
              ]
            : [],
      },
      configurable: true,
      writable: true,
    });

    const bus = new EventBus();
    const host = new PageMcpHost({ name: 'test', version: '1.0.0', bus });
    host.registerResource({
      uri: 'page://selector/.item',
      name: 'Visible line items',
      description: 'Current visible item summaries',
      mimeType: 'application/json',
    });
    host.start();

    const response = await bus.request('resources/read', { uri: 'page://selector/.item' });
    expect(response.error).toBeUndefined();
    expect(response.result).toEqual({
      contents: [
        {
          uri: 'page://selector/.item',
          mimeType: 'application/json',
          text: JSON.stringify({ content: [['Phone', '$99'], ['Case', '$19']] }),
        },
      ],
    });
  });
});
