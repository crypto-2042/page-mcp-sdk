import { describe, expect, test } from 'vitest';
import { EventBus } from '../src/transport.js';
import { PageMcpHost } from '../src/host.js';
import { PageMcpClient } from '../src/client.js';

describe('Client standard MCP methods', () => {
  test('exposes MCP-style method names in addition to convenience aliases', async () => {
    const bus = new EventBus();
    const host = new PageMcpHost({ name: 'test', version: '1.0.0', bus });

    host.registerTool({
      name: 'echo_tool',
      description: 'Echo tool',
      execute: async (input) => input,
    });

    host.registerResource({
      uri: 'page://example',
      name: 'Example Resource',
      description: 'Example',
      handler: async () => ({ contents: [{ uri: 'page://example', mimeType: 'text/plain', text: 'ok' }] }),
    });

    host.registerPrompt({
      name: 'example_prompt',
      description: 'Example prompt',
      handler: async () => ({
        messages: [{ role: 'assistant', content: { type: 'text', text: 'ok' } }],
      }),
    });

    host.start();

    const client = new PageMcpClient({ bus });
    await client.connect();

    expect(typeof (client as any).toolsList).toBe('function');
    expect(typeof (client as any).toolsCall).toBe('function');
    expect(typeof (client as any).resourcesList).toBe('function');
    expect(typeof (client as any).resourcesRead).toBe('function');
    expect(typeof (client as any).promptsList).toBe('function');
    expect(typeof (client as any).promptsGet).toBe('function');

    const tools = await (client as any).toolsList({ cursor: '0', limit: 10 });
    expect(tools.items[0].name).toBe('echo_tool');

    const toolCall = await (client as any).toolsCall('echo_tool', { hello: 'world' });
    expect(toolCall).toEqual({ content: { hello: 'world' } });

    const resources = await (client as any).resourcesList({ cursor: '0', limit: 10 });
    expect(resources.items[0].uri).toBe('page://example');

    const resource = await (client as any).resourcesRead('page://example');
    expect(resource).toEqual({
      contents: [{ uri: 'page://example', mimeType: 'text/plain', text: 'ok' }],
    });

    const prompts = await (client as any).promptsList({ cursor: '0', limit: 10 });
    expect(prompts.items[0].name).toBe('example_prompt');

    const prompt = await (client as any).promptsGet('example_prompt', {});
    expect(prompt).toEqual({
      messages: [{ role: 'assistant', content: { type: 'text', text: 'ok' } }],
    });
  });
});
