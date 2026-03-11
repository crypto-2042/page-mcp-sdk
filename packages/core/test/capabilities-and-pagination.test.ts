import { describe, expect, test } from 'vitest';
import { EventBus } from '../src/transport.js';
import { PageMcpHost } from '../src/host.js';
import { PageMcpClient } from '../src/client.js';

describe('Capabilities, pagination and list-changed notifications', () => {
  test('getHostInfo includes capabilities for tools/resources/prompts', async () => {
    const bus = new EventBus();
    const host = new PageMcpHost({ name: 'test', version: '1.0.0', bus });
    host.start();

    const response = await bus.request('getHostInfo');
    expect(response.error).toBeUndefined();
    expect(response.result).toMatchObject({
      name: 'test',
      version: '1.0.0',
      capabilities: {
        tools: { listChanged: true },
        resources: { listChanged: true },
        prompts: { listChanged: true },
      },
    });
  });

  test('list methods support cursor pagination and nextCursor', async () => {
    const bus = new EventBus();
    const host = new PageMcpHost({ name: 'test', version: '1.0.0', bus });

    host.registerTool({
      name: 'tool_1',
      description: 'Tool 1',
      execute: async () => 'ok',
    });
    host.registerTool({
      name: 'tool_2',
      description: 'Tool 2',
      execute: async () => 'ok',
    });
    host.registerTool({
      name: 'tool_3',
      description: 'Tool 3',
      execute: async () => 'ok',
    });

    host.start();

    const page1 = await bus.request('tools/list', { cursor: '0', limit: 2 });
    expect(page1.error).toBeUndefined();
    expect(page1.result).toEqual({
      items: [
        expect.objectContaining({ name: 'tool_1' }),
        expect.objectContaining({ name: 'tool_2' }),
      ],
      nextCursor: '2',
    });

    const page2 = await bus.request('tools/list', { cursor: '2', limit: 2 });
    expect(page2.error).toBeUndefined();
    expect(page2.result).toEqual({
      items: [expect.objectContaining({ name: 'tool_3' })],
      nextCursor: undefined,
    });

    host.registerResource({
      uri: 'page://resource_1',
      name: 'Resource 1',
      description: 'Resource 1',
    });
    host.registerResource({
      uri: 'page://resource_2',
      name: 'Resource 2',
      description: 'Resource 2',
    });
    host.registerResource({
      uri: 'page://resource_3',
      name: 'Resource 3',
      description: 'Resource 3',
    });

    const resourcesPage = await bus.request('resources/list', { cursor: '1', limit: 2 });
    expect(resourcesPage.error).toBeUndefined();
    expect(resourcesPage.result).toEqual({
      items: [
        expect.objectContaining({ uri: 'page://resource_2' }),
        expect.objectContaining({ uri: 'page://resource_3' }),
      ],
      nextCursor: undefined,
    });

    host.registerPrompt({
      name: 'prompt_1',
      description: 'Prompt 1',
      handler: async () => ({ messages: [{ role: 'assistant', content: { type: 'text', text: '1' } }] }),
    });
    host.registerPrompt({
      name: 'prompt_2',
      description: 'Prompt 2',
      handler: async () => ({ messages: [{ role: 'assistant', content: { type: 'text', text: '2' } }] }),
    });
    host.registerPrompt({
      name: 'prompt_3',
      description: 'Prompt 3',
      handler: async () => ({ messages: [{ role: 'assistant', content: { type: 'text', text: '3' } }] }),
    });

    const promptsPage = await bus.request('prompts/list', { cursor: '0', limit: 2 });
    expect(promptsPage.error).toBeUndefined();
    expect(promptsPage.result).toEqual({
      items: [
        expect.objectContaining({ name: 'prompt_1' }),
        expect.objectContaining({ name: 'prompt_2' }),
      ],
      nextCursor: '2',
    });
  });

  test('registry mutations emit list_changed notifications', async () => {
    const bus = new EventBus();
    const host = new PageMcpHost({ name: 'test', version: '1.0.0', bus });

    const events: string[] = [];
    bus.on('notifications/tools/list_changed', () => events.push('tools'));
    bus.on('notifications/resources/list_changed', () => events.push('resources'));
    bus.on('notifications/prompts/list_changed', () => events.push('prompts'));

    host.registerTool({
      name: 'tool_notify',
      description: 'Tool notify',
      execute: async () => 'ok',
    });

    host.registerResource({
      uri: 'page://notify',
      name: 'Notify Resource',
      description: 'Notify resource',
    });

    host.registerPrompt({
      name: 'notify_prompt',
      description: 'Notify prompt',
      handler: async () => ({
        messages: [
          { role: 'assistant', content: { type: 'text', text: 'ok' } },
        ],
      }),
    });

    expect(events).toContain('tools');
    expect(events).toContain('resources');
    expect(events).toContain('prompts');

    host.unregisterTool('tool_notify');
    host.unregisterResource('page://notify');
    host.unregisterPrompt('notify_prompt');

    const resourceEvents = events.filter((event) => event === 'resources');
    const promptEvents = events.filter((event) => event === 'prompts');
    expect(resourceEvents.length).toBeGreaterThanOrEqual(2);
    expect(promptEvents.length).toBeGreaterThanOrEqual(2);

    host.start();

    const client = new PageMcpClient({ bus });
    await client.connect();

    expect((await client.listTools()).length).toBe(0);
    expect((await client.listResources()).length).toBe(0);
    expect((await client.listPrompts()).length).toBe(0);
  });
});
