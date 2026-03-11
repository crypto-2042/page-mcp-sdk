import { describe, expect, test } from 'vitest';
import { EventBus } from '../src/transport.js';
import { PageMcpHost } from '../src/host.js';
import { PageMcpClient } from '../src/client.js';

describe('Prompts contract', () => {
  test('prompts/list and prompts/get follow MCP-like template shape', async () => {
    const bus = new EventBus();
    const host = new PageMcpHost({ name: 'test', version: '1.0.0', bus });

    host.registerPrompt({
      name: 'checkout_assistant',
      description: 'Guide user to complete checkout',
      arguments: [
        {
          name: 'customer_name',
          required: true,
          description: 'Name of the customer',
        },
      ],
      messages: [
        {
          role: 'assistant',
          content: {
            type: 'text',
            text: 'Hello {{customer_name}}. Ready to complete checkout?',
          },
        },
      ],
    });

    host.start();

    const listResponse = await bus.request('prompts/list');
    expect(listResponse.error).toBeUndefined();
    expect(listResponse.result).toEqual({
      items: [
        {
          name: 'checkout_assistant',
          description: 'Guide user to complete checkout',
          arguments: [
            {
              name: 'customer_name',
              required: true,
              description: 'Name of the customer',
            },
          ],
        },
      ],
      nextCursor: undefined,
    });

    const getResponse = await bus.request('prompts/get', {
      name: 'checkout_assistant',
      arguments: { customer_name: 'Alice' },
    });
    expect(getResponse.error).toBeUndefined();
    expect(getResponse.result).toEqual({
      messages: [
        {
          role: 'assistant',
          content: {
            type: 'text',
            text: 'Hello Alice. Ready to complete checkout?',
          },
        },
      ],
    });

    const client = new PageMcpClient({ bus });
    await client.connect();

    expect(await client.promptsList({ cursor: '0', limit: 20 })).toEqual(listResponse.result);
    expect(await client.getPrompt('checkout_assistant', { customer_name: 'Alice' })).toEqual(
      getResponse.result
    );
  });
});
