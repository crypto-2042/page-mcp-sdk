// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AnthropicMcpPrompt, AnthropicMcpResource } from '@page-mcp/protocol';
import type { ChatConfig, ChatEngineEvents, ToolCallInfo } from '../src/types.js';

let mockResources: AnthropicMcpResource[] = [];
let mockPrompts: AnthropicMcpPrompt[] = [];
let attachedUris: string[] = [];
let appliedPromptShortcuts: string[] = [];
let abortRequestCount = 0;
let engineLoading = false;

class MockChatEngine {
  private handlers = new Map<keyof ChatEngineEvents, Set<Function>>();

  constructor(_config: ChatConfig) {}

  async init() {}
  destroy() {}
  getPrompts() { return mockPrompts; }
  getResources() { return mockResources; }
  getAttachedResourceUris() { return [...attachedUris]; }
  setAttachedResourceUris(uris: string[]) { attachedUris = [...uris]; }
  isLoading() { return engineLoading; }
  abortActiveRequest() { abortRequestCount += 1; return true; }
  clearMessages() {}
  async sendMessage() {}
  async applyPromptShortcut(name: string) { appliedPromptShortcuts.push(name); }

  on<K extends keyof ChatEngineEvents>(event: K, handler: ChatEngineEvents[K]) {
    const set = this.handlers.get(event) ?? new Set();
    set.add(handler as Function);
    this.handlers.set(event, set);
  }

  emit<K extends keyof ChatEngineEvents>(event: K, ...args: Parameters<ChatEngineEvents[K]>) {
    for (const handler of this.handlers.get(event) ?? []) {
      (handler as (...innerArgs: Parameters<ChatEngineEvents[K]>) => void)(...args);
    }
  }
}

vi.mock('../src/chat-engine.js', () => ({
  ChatEngine: MockChatEngine,
}));

const { ChatWidget } = await import('../src/chat-widget.js');

async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('ChatWidget UI details', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    mockResources = [];
    mockPrompts = [];
    attachedUris = [];
    appliedPromptShortcuts = [];
    abortRequestCount = 0;
    engineLoading = false;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('shows only resource names in the resource picker', async () => {
    mockResources = [
      {
        name: 'Visible Product Names',
        description: 'Names of products currently visible in the grid',
        uri: 'page://selector/.product-name',
        mimeType: 'application/json',
      },
    ];

    const widget = new ChatWidget({ endpoint: { url: '/api/chat' } });
    await flush();

    const shadow = document.body.querySelector('#page-mcp-chat-widget')?.shadowRoot;
    expect(shadow).toBeTruthy();

    const toggle = shadow!.querySelector('.mcp-resource-toggle-btn') as HTMLButtonElement;
    toggle.click();

    const style = shadow!.querySelector('style') as HTMLStyleElement;
    const panel = shadow!.querySelector('.mcp-resource-panel') as HTMLDivElement;
    const option = shadow!.querySelector('.mcp-resource-option') as HTMLLabelElement;
    const checkbox = shadow!.querySelector('.mcp-resource-checkbox') as HTMLInputElement;

    expect(panel.textContent).toContain('Visible Product Names');
    expect(panel.textContent).not.toContain('Names of products currently visible in the grid');
    expect(panel.textContent).not.toContain('page://selector/.product-name');
    expect(panel.textContent).not.toContain('application/json');
    expect(option).toBeTruthy();
    expect(checkbox).toBeTruthy();
    expect(style.textContent).toContain('.mcp-resource-option + .mcp-resource-option');
    expect(style.textContent).toContain('.mcp-resource-checkbox');

    widget.destroy();
  });

  it('uses MCP prompt shortcuts instead of sending prompt descriptions as chat input', async () => {
    mockPrompts = [
      {
        name: 'recommend-products',
        description: 'Ask AI to recommend popular products',
      },
    ];

    const widget = new ChatWidget({ endpoint: { url: '/api/chat' } });
    await flush();

    const shadow = document.body.querySelector('#page-mcp-chat-widget')?.shadowRoot;
    expect(shadow).toBeTruthy();

    const style = shadow!.querySelector('style') as HTMLStyleElement;
    const promptsContainer = shadow!.querySelector('.mcp-prompts') as HTMLDivElement;
    const card = shadow!.querySelector('.mcp-prompt-card') as HTMLButtonElement;
    expect(promptsContainer).toBeTruthy();
    expect(card.textContent).toContain('recommend-products');
    expect(style.textContent).toContain('.mcp-prompts');
    expect(style.textContent).toContain('justify-items: start;');

    card.click();

    expect(appliedPromptShortcuts).toEqual(['recommend-products']);

    widget.destroy();
  });

  it('supports a light theme and lets the header toggle switch themes', async () => {
    const widget = new ChatWidget({ endpoint: { url: '/api/chat' }, theme: 'light' });
    await flush();

    const shadow = document.body.querySelector('#page-mcp-chat-widget')?.shadowRoot;
    expect(shadow).toBeTruthy();

    const style = shadow!.querySelector('style') as HTMLStyleElement;
    expect(style.textContent).toContain('--mcp-bg-primary: rgba(255, 255, 255, 0.85);');

    const themeBtn = shadow!.querySelector('.mcp-theme-btn') as HTMLButtonElement;
    themeBtn.click();

    expect(style.textContent).toContain('--mcp-bg-primary: rgba(15, 10, 30, 0.85);');

    widget.destroy();
  });

  it('switches the send button into a stop control while waiting and aborts on click', async () => {
    const widget = new ChatWidget({ endpoint: { url: '/api/chat' } });
    await flush();

    const shadow = document.body.querySelector('#page-mcp-chat-widget')?.shadowRoot;
    expect(shadow).toBeTruthy();

    const engine = (widget as unknown as { engine: MockChatEngine }).engine;
    const sendBtn = shadow!.querySelector('.mcp-send-btn') as HTMLButtonElement;

    engineLoading = true;
    engine.emit('loading', true);

    expect(sendBtn.classList.contains('stop-mode')).toBe(true);
    expect(sendBtn.getAttribute('aria-label')).toBe('Stop response');

    sendBtn.click();

    expect(abortRequestCount).toBe(1);

    widget.destroy();
  });

  it('renders tool call results as collapsed cards with an expand toggle', async () => {
    const widget = new ChatWidget({ endpoint: { url: '/api/chat' } });
    await flush();

    const shadow = document.body.querySelector('#page-mcp-chat-widget')?.shadowRoot;
    expect(shadow).toBeTruthy();

    const engine = (widget as unknown as { engine: MockChatEngine }).engine;
    const toolCall: ToolCallInfo = {
      id: 'tool_1',
      name: 'searchProducts',
      args: { query: 'keyboard' },
      status: 'calling',
    };

    engine.emit('toolcall:start', 'msg_1', toolCall);
    engine.emit('toolcall:end', 'msg_1', {
      ...toolCall,
      status: 'success',
      result: { items: ['Mechanical Keyboard'] },
    });

    const card = shadow!.querySelector('[data-tool-call-id="tool_1"]') as HTMLElement;
    expect(card).toBeTruthy();
    expect(card.textContent).toContain('searchProducts');
    expect(card.textContent).toContain('Done');

    const toggle = card.querySelector('.mcp-tool-toggle') as HTMLButtonElement;
    const resultWrap = card.querySelector('.mcp-tool-result-wrap') as HTMLDivElement;
    const argsLabel = card.querySelector('.mcp-tool-args-label') as HTMLDivElement;
    const argsValue = card.querySelector('.mcp-tool-args') as HTMLDivElement;
    const result = card.querySelector('.mcp-tool-result') as HTMLDivElement;
    const resultLabel = card.querySelector('.mcp-tool-result-label') as HTMLDivElement;

    expect(toggle).toBeTruthy();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(resultWrap.hidden).toBe(true);
    expect(argsLabel.textContent).toBe('Input');
    expect(argsValue.textContent).toContain('"query": "keyboard"');
    expect(resultLabel.textContent).toBe('Result');
    expect(result.textContent).toContain('Mechanical Keyboard');

    toggle.click();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(resultWrap.hidden).toBe(false);

    widget.destroy();
  });

  it('labels failed tool calls as errors', async () => {
    const widget = new ChatWidget({ endpoint: { url: '/api/chat' } });
    await flush();

    const shadow = document.body.querySelector('#page-mcp-chat-widget')?.shadowRoot;
    expect(shadow).toBeTruthy();

    const engine = (widget as unknown as { engine: MockChatEngine }).engine;
    const toolCall: ToolCallInfo = {
      id: 'tool_2',
      name: 'placeOrder',
      args: {},
      status: 'calling',
    };

    engine.emit('toolcall:start', 'msg_2', toolCall);
    engine.emit('toolcall:end', 'msg_2', {
      ...toolCall,
      status: 'error',
      error: 'Checkout failed',
    });

    const card = shadow!.querySelector('[data-tool-call-id="tool_2"]') as HTMLElement;
    const resultWrap = card.querySelector('.mcp-tool-result-wrap') as HTMLDivElement;
    const argsLabel = card.querySelector('.mcp-tool-args-label') as HTMLDivElement;
    const argsValue = card.querySelector('.mcp-tool-args') as HTMLDivElement;
    const resultLabel = card.querySelector('.mcp-tool-result-label') as HTMLDivElement;
    const result = card.querySelector('.mcp-tool-result') as HTMLDivElement;

    expect(argsLabel.textContent).toBe('Input');
    expect(argsValue.textContent).toBe('{}');
    expect(resultLabel.textContent).toBe('Error');
    expect(result.textContent).toContain('Checkout failed');
    expect(resultWrap.hidden).toBe(true);

    widget.destroy();
  });

  it('does not render an empty assistant bubble for tool-only messages', async () => {
    const widget = new ChatWidget({ endpoint: { url: '/api/chat' } });
    await flush();

    const shadow = document.body.querySelector('#page-mcp-chat-widget')?.shadowRoot;
    expect(shadow).toBeTruthy();

    const engine = (widget as unknown as { engine: MockChatEngine }).engine;
    engine.emit('message', {
      id: 'msg_tool_only',
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      toolCalls: [],
    });
    engine.emit('toolcall:start', 'msg_tool_only', {
      id: 'tool_3',
      name: 'searchProducts',
      args: { query: 'mouse' },
      status: 'calling',
    });

    expect(shadow!.querySelector('[data-msg-id="msg_tool_only"]')).toBeNull();
    expect(shadow!.querySelector('[data-tool-call-id="tool_3"]')).toBeTruthy();

    widget.destroy();
  });
});
