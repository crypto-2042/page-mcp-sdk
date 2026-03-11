import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatEngine } from '../src/chat-engine.js';

let mockTools: Array<Record<string, unknown>> = [];
let mockResources: Array<Record<string, unknown>> = [];
let mockPrompts: Array<Record<string, unknown>> = [];
let mockPromptResult: {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: { type: 'text'; text: string };
  }>;
} = { messages: [] };

vi.mock('@page-mcp/core', () => {
  class MockPageMcpClient {
    async connect() {}
    async listTools() { return mockTools; }
    async listResources() { return mockResources; }
    async listPrompts() { return mockPrompts; }
    async getPrompt() { return mockPromptResult; }
    async callTool() { return { ok: true }; }
    async readResource(uri: string) {
      return {
        contents: [
          {
            uri,
            mimeType: uri.includes('cart') ? 'text/plain' : 'application/json',
            text: uri.includes('cart')
              ? '$89.99'
              : '{"content":["Wireless Headphones","Mechanical Keyboard"]}',
          },
        ],
      };
    }
    disconnect() {}
  }

  class MockEventBus {}

  return {
    PageMcpClient: MockPageMcpClient,
    EventBus: MockEventBus,
  };
});

function sseResponse(lines: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const line of lines) {
        controller.enqueue(encoder.encode(`${line}\n\n`));
      }
      controller.close();
    },
  });
  return new Response(stream, { status: 200 });
}

function abortablePendingResponse(signal: AbortSignal): Promise<Response> {
  return new Promise((_resolve, reject) => {
    const onAbort = () => reject(new DOMException('The operation was aborted.', 'AbortError'));
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

describe('ChatEngine direct mode streaming', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockTools = [];
    mockResources = [];
    mockPrompts = [];
    mockPromptResult = { messages: [] };
  });

  it('streams assistant chunks and assembles final content', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(sseResponse([
      'data: {"choices":[{"delta":{"content":"Hel"}}]}',
      'data: {"choices":[{"delta":{"content":"lo"}}]}',
      'data: {"choices":[{"delta":{},"finish_reason":"stop"}]}',
      'data: [DONE]',
    ]));
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    const engine = new ChatEngine({
      openai: { apiKey: 'test-key', model: 'gpt-5.2' },
    });

    const streamChunks: string[] = [];
    const updates: string[] = [];
    engine.on('message:stream', (_, chunk) => streamChunks.push(chunk));
    engine.on('message:update', (message) => updates.push(message.content));

    await engine.sendMessage('hello');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, req] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(req.body)) as { stream?: boolean };
    expect(body.stream).toBe(true);

    expect(streamChunks).toEqual(['Hel', 'lo']);
    expect(updates.at(-1)).toBe('Hello');
    const assistant = engine.getMessages().filter(m => m.role === 'assistant').at(-1);
    expect(assistant?.content).toBe('Hello');
  });

  it('uses non-stream response when disabled in config', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({
      choices: [{ message: { content: 'full-response' } }],
    }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    const engine = new ChatEngine({
      openai: { apiKey: 'test-key', stream: false },
    });

    await engine.sendMessage('hello');

    const [, req] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(req.body)) as { stream?: boolean };
    expect(body.stream).toBe(false);
    const assistant = engine.getMessages().filter(m => m.role === 'assistant').at(-1);
    expect(assistant?.content).toBe('full-response');
  });

  it('handles streaming tool calls before any assistant text without crashing', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(sseResponse([
        'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"call_1","function":{"name":"lookup","arguments":"{\\"query\\":\\"headphones\\"}"}}]}}]}',
        'data: {"choices":[{"delta":{},"finish_reason":"tool_calls"}]}',
        'data: [DONE]',
      ]))
      .mockResolvedValueOnce(sseResponse([
        'data: {"choices":[{"delta":{"content":"Found it."}}]}',
        'data: {"choices":[{"delta":{},"finish_reason":"stop"}]}',
        'data: [DONE]',
      ]));
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    const engine = new ChatEngine({
      openai: { apiKey: 'test-key', model: 'gpt-5.2' },
    });

    await engine.sendMessage('find headphones');

    const assistantMessages = engine.getMessages().filter(m => m.role === 'assistant');
    expect(assistantMessages.at(-1)?.content).toBe('Found it.');
    expect(assistantMessages.some((message) => message.content.includes('TypeError'))).toBe(false);
    expect(assistantMessages.some((message) => (message.toolCalls?.length ?? 0) > 0)).toBe(true);
  });

  it('handles endpoint tool calls without crashing', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        choices: [{
          message: {
            content: '',
            tool_calls: [{
              id: 'call_1',
              function: {
                name: 'lookup',
                arguments: '{"query":"headphones"}',
              },
            }],
          },
        }],
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        choices: [{ message: { content: 'Found it from endpoint.' } }],
      }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    const engine = new ChatEngine({
      endpoint: { url: '/api/chat' },
    });

    await engine.sendMessage('find headphones');

    const assistantMessages = engine.getMessages().filter(m => m.role === 'assistant');
    expect(assistantMessages.at(-1)?.content).toBe('Found it from endpoint.');
    expect(assistantMessages.some((message) => message.content.includes('TypeError'))).toBe(false);
    expect(assistantMessages.some((message) => (message.toolCalls?.length ?? 0) > 0)).toBe(true);
  });

  it('does not inject resources or prompts into AI system messages when no tools are available', async () => {
    mockResources = [
      {
        name: 'Visible Product Names',
        description: 'Names of products currently visible in the grid',
        uri: 'page://selector/.product-name',
        mimeType: 'application/json',
      },
    ];
    mockPrompts = [
      {
        name: 'recommend-products',
        description: 'Ask AI to recommend popular products',
      },
    ];

    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({
      choices: [{ message: { content: 'ok' } }],
    }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    const engine = new ChatEngine({
      openai: { apiKey: 'test-key', stream: false },
    });

    await engine.init();
    await engine.sendMessage('hello');

    const [, req] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(req.body)) as { messages: Array<{ role: string; content: string }> };
    const systemMessages = body.messages.filter((message) => message.role === 'system').map((message) => message.content);

    expect(systemMessages.some((message) => message.includes('page resources'))).toBe(false);
    expect(systemMessages.some((message) => message.includes('Visible Product Names'))).toBe(false);
    expect(systemMessages.some((message) => message.includes('page prompts'))).toBe(false);
    expect(systemMessages.some((message) => message.includes('recommend-products'))).toBe(false);
    expect((body as { tools?: unknown[] }).tools ?? []).toHaveLength(0);
  });

  it('passes tools through the API tools field without duplicating them in system messages', async () => {
    mockTools = [
      {
        name: 'lookup',
        description: 'Look up products on the page',
        inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
      },
    ];

    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({
      choices: [{ message: { content: 'ok' } }],
    }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    const engine = new ChatEngine({
      openai: { apiKey: 'test-key', stream: false },
    });

    await engine.init();
    await engine.sendMessage('hello');

    const [, req] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(req.body)) as {
      tools?: Array<{ function?: { name?: string } }>;
      messages: Array<{ role: string; content: string }>;
    };
    const systemMessages = body.messages.filter((message) => message.role === 'system').map((message) => message.content);

    expect(body.tools).toHaveLength(1);
    expect(body.tools?.[0]?.function?.name).toBe('lookup');
    expect(systemMessages.some((message) => message.includes('page tools'))).toBe(false);
    expect(systemMessages.some((message) => message.includes('lookup'))).toBe(false);
  });

  it('attaches selected resource contents to the current conversation turn', async () => {
    mockResources = [
      {
        name: 'Visible Product Names',
        description: 'Names of products currently visible in the grid',
        uri: 'page://selector/.product-name',
        mimeType: 'application/json',
      },
      {
        name: 'Cart Summary Text',
        description: 'Current cart total summary',
        uri: 'page://selector/#cart-total',
        mimeType: 'text/plain',
      },
    ];

    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({
      choices: [{ message: { content: 'ok' } }],
    }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    const engine = new ChatEngine({
      openai: { apiKey: 'test-key', stream: false },
      defaultAttachedResources: ['page://selector/.product-name', 'page://selector/#cart-total'],
    });

    await engine.init();
    await engine.sendMessage('hello');

    const [, req] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(req.body)) as { messages: Array<{ role: string; content: string }> };
    const systemMessages = body.messages.filter((message) => message.role === 'system').map((message) => message.content);

    expect(systemMessages.some((message) => message.includes('Attached page resources for this conversation turn'))).toBe(true);
    expect(systemMessages.some((message) => message.includes('[Visible Product Names]'))).toBe(true);
    expect(systemMessages.some((message) => message.includes('Wireless Headphones'))).toBe(true);
    expect(systemMessages.some((message) => message.includes('[Cart Summary Text]'))).toBe(true);
    expect(systemMessages.some((message) => message.includes('$89.99'))).toBe(true);
  });

  it('does not attach resource contents when no resources are selected', async () => {
    mockResources = [
      {
        name: 'Visible Product Names',
        description: 'Names of products currently visible in the grid',
        uri: 'page://selector/.product-name',
        mimeType: 'application/json',
      },
    ];

    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({
      choices: [{ message: { content: 'ok' } }],
    }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    const engine = new ChatEngine({
      openai: { apiKey: 'test-key', stream: false },
    });

    await engine.init();
    await engine.sendMessage('hello');

    const [, req] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(req.body)) as { messages: Array<{ role: string; content: string }> };
    const systemMessages = body.messages.filter((message) => message.role === 'system').map((message) => message.content);

    expect(systemMessages.some((message) => message.includes('Attached page resources for this conversation turn'))).toBe(false);
    expect(systemMessages.some((message) => message.includes('[Visible Product Names]'))).toBe(false);
  });

  it('preserves prior resource snapshots when the attached selection changes across turns', async () => {
    mockResources = [
      {
        name: 'Visible Product Names',
        description: 'Names of products currently visible in the grid',
        uri: 'page://selector/.product-name',
        mimeType: 'application/json',
      },
      {
        name: 'Cart Summary Text',
        description: 'Current cart total summary',
        uri: 'page://selector/#cart-total',
        mimeType: 'text/plain',
      },
    ];

    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        choices: [{ message: { content: 'First turn ok' } }],
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        choices: [{ message: { content: 'Second turn ok' } }],
      }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    const engine = new ChatEngine({
      openai: { apiKey: 'test-key', stream: false },
      defaultAttachedResources: ['page://selector/.product-name'],
    });

    await engine.init();
    await engine.sendMessage('hello');

    engine.setAttachedResourceUris(['page://selector/#cart-total']);
    await engine.sendMessage('what changed?');

    const [, secondReq] = fetchMock.mock.calls[1] as [string, RequestInit];
    const secondBody = JSON.parse(String(secondReq.body)) as { messages: Array<{ role: string; content: string }> };
    const systemMessages = secondBody.messages.filter((message) => message.role === 'system').map((message) => message.content);

    expect(systemMessages.filter((message) => message.includes('Attached page resources for this conversation turn'))).toHaveLength(2);
    expect(systemMessages.some((message) => message.includes('[Visible Product Names]'))).toBe(true);
    expect(systemMessages.some((message) => message.includes('[Cart Summary Text]'))).toBe(true);

    const hiddenSnapshots = engine.getMessages().filter((message) => message.role === 'system' && message.hidden);
    expect(hiddenSnapshots).toHaveLength(2);
  });

  it('uses prompts/get results when executing a prompt shortcut', async () => {
    mockPrompts = [
      {
        name: 'recommend-products',
        description: 'Ask AI to recommend popular products',
      },
    ];
    mockPromptResult = {
      messages: [
        {
          role: 'system',
          content: { type: 'text', text: 'Prefer concise shopping advice.' },
        },
        {
          role: 'user',
          content: { type: 'text', text: 'Recommend the top 3 best-value products.' },
        },
      ],
    };

    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({
      choices: [{ message: { content: 'Here are three picks.' } }],
    }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    const engine = new ChatEngine({
      openai: { apiKey: 'test-key', stream: false },
    });

    await engine.init();
    await engine.applyPromptShortcut('recommend-products');

    const [, req] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(req.body)) as { messages: Array<{ role: string; content: string }> };
    const systemMessages = body.messages.filter((message) => message.role === 'system').map((message) => message.content);
    const userMessages = body.messages.filter((message) => message.role === 'user').map((message) => message.content);

    expect(systemMessages).toContain('Prefer concise shopping advice.');
    expect(userMessages).toContain('Recommend the top 3 best-value products.');
    expect(userMessages).not.toContain('Ask AI to recommend popular products');

    const userConversationMessages = engine.getMessages().filter((message) => message.role === 'user');
    expect(userConversationMessages.at(-1)?.content).toBe('Recommend the top 3 best-value products.');
  });

  it('aborts an in-flight direct request without emitting an error bubble', async () => {
    const fetchMock = vi.fn((_, req?: RequestInit) => {
      const signal = req?.signal as AbortSignal | undefined;
      if (!signal) throw new Error('Expected abort signal');
      return abortablePendingResponse(signal);
    });
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    const engine = new ChatEngine({
      openai: { apiKey: 'test-key', stream: false },
    });

    await engine.init();

    const aborted = vi.fn();
    engine.on('aborted', aborted);

    const sendPromise = engine.sendMessage('hello');
    await Promise.resolve();
    await Promise.resolve();
    expect(engine.isLoading()).toBe(true);
    expect(engine.abortActiveRequest()).toBe(true);

    await sendPromise;

    expect(aborted).toHaveBeenCalledTimes(1);
    expect(engine.isLoading()).toBe(false);
    expect(engine.getMessages().some((message) => message.content.includes('⚠️ Error'))).toBe(false);
  });
});
