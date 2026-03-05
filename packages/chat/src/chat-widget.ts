// ============================================================
// @page-mcp/chat — ChatWidget (Shadow DOM UI Component)
// ============================================================

import { ChatEngine } from './chat-engine.js';
import { generateStyles } from './styles.js';
import { renderMarkdown } from './markdown.js';
import type { ChatConfig, ChatMessage, ToolCallInfo } from './types.js';

// SVG icons
const ICON_CHAT = `<svg viewBox="0 0 24 24" class="mcp-fab-icon"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.82.49 3.53 1.34 5L2 22l5-1.34C8.47 21.51 10.18 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.62 0-3.13-.46-4.42-1.24l-.31-.18-3.22.85.85-3.22-.18-.31A7.963 7.963 0 014 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z"/><circle cx="8" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="16" cy="12" r="1.2"/></svg>`;
const ICON_CLOSE = `✕`;
const ICON_SEND = `<svg viewBox="0 0 24 24" class="mcp-send-icon"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`;
const ICON_TOOL = `<svg viewBox="0 0 24 24" class="mcp-tool-icon"><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/></svg>`;
const ICON_CLEAR = `<svg viewBox="0 0 24 24" class="mcp-clear-icon"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`;

/**
 * ChatWidget renders the complete chat interface inside Shadow DOM.
 */
export class ChatWidget {
    private container: HTMLDivElement;
    private shadowRoot: ShadowRoot;
    private engine: ChatEngine;
    private config: Required<Pick<ChatConfig, 'position' | 'expandMode' | 'theme' | 'accentColor' | 'title' | 'placeholder' | 'width' | 'height'>> & ChatConfig;
    private isOpen = false;
    /** Max number of prompt shortcut cards to display */
    private maxPrompts = 3;

    // DOM references
    private fab!: HTMLButtonElement;
    private panel!: HTMLDivElement;
    private messagesContainer!: HTMLDivElement;
    private promptsContainer!: HTMLDivElement;
    private input!: HTMLInputElement;
    private sendBtn!: HTMLButtonElement;
    private loadingEl!: HTMLDivElement;

    constructor(config: ChatConfig) {
        this.config = {
            position: 'bottom-right',
            expandMode: 'popup',
            theme: 'dark',
            accentColor: '#6C5CE7',
            title: 'AI Assistant',
            placeholder: 'Type a message...',
            width: 400,
            height: 620,
            ...config,
        };

        this.engine = new ChatEngine(config);

        // Create Shadow DOM container
        this.container = document.createElement('div');
        this.container.id = 'page-mcp-chat-widget';
        this.shadowRoot = this.container.attachShadow({ mode: 'open' });

        // Load Inter font
        this.loadFont();

        // Inject styles
        const styleEl = document.createElement('style');
        styleEl.textContent = generateStyles(this.config.theme, this.config.accentColor);
        if (this.config.customCSS) {
            styleEl.textContent += '\n' + this.config.customCSS;
        }
        this.shadowRoot.appendChild(styleEl);

        // Build UI
        this.buildFAB();
        this.buildPanel();

        // Bind engine events
        this.bindEngineEvents();

        // Mount to DOM
        document.body.appendChild(this.container);

        // Initialize engine then render prompts
        this.engine.init().then(() => {
            this.renderPromptCards();
        });
    }

    // ---- Build UI ----

    private loadFont(): void {
        // Only add if not already present
        if (!document.querySelector('link[href*="fonts.googleapis.com/css2?family=Inter"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
            document.head.appendChild(link);
        }
    }

    private buildFAB(): void {
        this.fab = document.createElement('button');
        this.fab.className = `mcp-fab ${this.config.position}`;
        this.fab.innerHTML = this.config.fabIcon
            ? `<img src="${this.config.fabIcon}" class="mcp-fab-icon" alt="Chat" style="width:26px;height:26px;">`
            : ICON_CHAT;
        this.fab.setAttribute('aria-label', 'Open AI Chat');
        this.fab.addEventListener('click', () => this.toggle());
        this.shadowRoot.appendChild(this.fab);
    }

    private buildPanel(): void {
        this.panel = document.createElement('div');
        this.panel.className = `mcp-panel ${this.config.position}`;
        this.panel.style.width = `${this.config.width}px`;
        this.panel.style.height = `${this.config.height}px`;

        this.panel.innerHTML = `
            <div class="mcp-mobile-handle"></div>
            <div class="mcp-header">
                <div class="mcp-header-left">
                    <div class="mcp-header-dot"></div>
                    <span class="mcp-header-title">${this.escapeHtml(this.config.title)}</span>
                </div>
                <div class="mcp-header-actions">
                    <button class="mcp-clear-btn" aria-label="Clear chat" title="Clear chat">${ICON_CLEAR}</button>
                    <button class="mcp-close-btn" aria-label="Close chat">${ICON_CLOSE}</button>
                </div>
            </div>
            <div class="mcp-messages"></div>
            <div class="mcp-loading" style="display:none">
                <div class="mcp-loading-dot"></div>
                <div class="mcp-loading-dot"></div>
                <div class="mcp-loading-dot"></div>
            </div>
            <div class="mcp-input-area">
                <input class="mcp-input" type="text" placeholder="${this.escapeHtml(this.config.placeholder)}" autocomplete="off">
                <button class="mcp-send-btn" aria-label="Send message">${ICON_SEND}</button>
            </div>
        `;

        // Cache DOM refs
        this.messagesContainer = this.panel.querySelector('.mcp-messages')!;
        this.input = this.panel.querySelector('.mcp-input')!;
        this.sendBtn = this.panel.querySelector('.mcp-send-btn')!;
        this.loadingEl = this.panel.querySelector('.mcp-loading')!;

        // Bind events
        this.panel.querySelector('.mcp-close-btn')!.addEventListener('click', () => this.close());
        this.panel.querySelector('.mcp-clear-btn')!.addEventListener('click', () => this.clearChat());
        this.sendBtn.addEventListener('click', () => this.handleSend());
        this.input.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSend();
            }
        });

        // Mobile swipe-to-dismiss
        let touchStartY = 0;
        const handle = this.panel.querySelector('.mcp-mobile-handle')!;
        handle.addEventListener('touchstart', (e: Event) => {
            touchStartY = (e as TouchEvent).touches[0].clientY;
        });
        handle.addEventListener('touchmove', (e: Event) => {
            const deltaY = (e as TouchEvent).touches[0].clientY - touchStartY;
            if (deltaY > 80) {
                this.close();
            }
        });

        this.shadowRoot.appendChild(this.panel);
    }

    private renderPromptCards(): void {
        const prompts = this.engine.getPrompts();
        if (prompts.length === 0) return;

        // Remove existing prompts container if any
        if (this.promptsContainer) {
            this.promptsContainer.remove();
        }

        this.promptsContainer = document.createElement('div');
        this.promptsContainer.className = 'mcp-prompts';

        // Limit the number of displayed prompt cards
        const displayPrompts = prompts.slice(0, this.maxPrompts);

        for (const prompt of displayPrompts) {
            const card = document.createElement('button');
            card.className = 'mcp-prompt-card';
            card.innerHTML = `${prompt.icon ? `<span class="mcp-prompt-icon">${this.escapeHtml(prompt.icon)}</span>` : ''}${this.escapeHtml(prompt.title)}`;
            card.setAttribute('title', prompt.description);
            card.addEventListener('click', () => {
                this.hidePromptCards();
                this.engine.sendMessage(prompt.prompt);
            });
            this.promptsContainer.appendChild(card);
        }

        // Insert after messages container, before loading indicator
        this.messagesContainer.parentNode!.insertBefore(this.promptsContainer, this.loadingEl);
    }

    private hidePromptCards(): void {
        if (this.promptsContainer) {
            this.promptsContainer.classList.add('hidden');
        }
    }

    // ---- Engine Event Handlers ----

    private bindEngineEvents(): void {
        this.engine.on('message', (msg) => {
            this.renderMessage(msg);
            this.scrollToBottom();
        });

        this.engine.on('message:update', (msg) => {
            this.updateMessage(msg);
            this.scrollToBottom();
        });

        this.engine.on('toolcall:start', (msgId, toolCall) => {
            this.renderToolCall(msgId, toolCall);
            this.scrollToBottom();
        });

        this.engine.on('toolcall:end', (_msgId, toolCall) => {
            this.updateToolCall(toolCall);
            this.scrollToBottom();
        });

        this.engine.on('loading', (loading) => {
            this.loadingEl.style.display = loading ? 'flex' : 'none';
            this.sendBtn.disabled = loading;
            if (loading) this.scrollToBottom();
        });

        this.engine.on('error', (err) => {
            console.error('[PageMcpChat]', err);
        });
    }

    // ---- Render Messages ----

    private renderMessage(msg: ChatMessage): void {
        const el = document.createElement('div');
        el.className = `mcp-msg mcp-msg-${msg.role}`;
        el.dataset.msgId = msg.id;

        const label = document.createElement('div');
        label.className = 'mcp-msg-label';
        label.textContent = msg.role === 'user' ? 'You' : this.config.title;
        el.appendChild(label);

        const bubble = document.createElement('div');
        bubble.className = 'mcp-bubble';
        bubble.innerHTML = renderMarkdown(msg.content);
        el.appendChild(bubble);

        this.messagesContainer.appendChild(el);
    }

    private updateMessage(msg: ChatMessage): void {
        const el = this.messagesContainer.querySelector(`[data-msg-id="${msg.id}"]`);
        if (!el) return;

        const bubble = el.querySelector('.mcp-bubble');
        if (bubble && msg.content) {
            bubble.innerHTML = renderMarkdown(msg.content);
        }
    }

    private renderToolCall(_msgId: string, toolCall: ToolCallInfo): void {
        const card = document.createElement('div');
        card.className = 'mcp-tool-card';
        card.dataset.toolCallId = toolCall.id;

        card.innerHTML = `
            <div class="mcp-tool-header">
                ${ICON_TOOL}
                <span class="mcp-tool-name">${this.escapeHtml(toolCall.name)}</span>
                <span class="mcp-tool-status ${toolCall.status}">${this.getStatusText(toolCall.status)}</span>
            </div>
        `;

        this.messagesContainer.appendChild(card);
    }

    private updateToolCall(toolCall: ToolCallInfo): void {
        const card = this.messagesContainer.querySelector(`[data-tool-call-id="${toolCall.id}"]`) as HTMLElement;
        if (!card) return;

        const statusEl = card.querySelector('.mcp-tool-status')!;
        statusEl.className = `mcp-tool-status ${toolCall.status}`;
        statusEl.textContent = this.getStatusText(toolCall.status);

        // Show result/error
        if (toolCall.status === 'success' && toolCall.result !== undefined) {
            let existing = card.querySelector('.mcp-tool-result');
            if (!existing) {
                existing = document.createElement('div');
                existing.className = 'mcp-tool-result';
                card.appendChild(existing);
            }
            const resultStr = typeof toolCall.result === 'string'
                ? toolCall.result
                : JSON.stringify(toolCall.result, null, 2);
            existing.textContent = resultStr.length > 300 ? resultStr.slice(0, 300) + '...' : resultStr;
        } else if (toolCall.status === 'error' && toolCall.error) {
            let existing = card.querySelector('.mcp-tool-result');
            if (!existing) {
                existing = document.createElement('div');
                existing.className = 'mcp-tool-result';
                card.appendChild(existing);
            }
            existing.textContent = `Error: ${toolCall.error}`;
        }
    }

    private getStatusText(status: string): string {
        switch (status) {
            case 'calling': return '⏳ Calling...';
            case 'success': return '✓ Done';
            case 'error': return '✗ Failed';
            default: return status;
        }
    }

    // ---- Actions ----

    private async handleSend(): Promise<void> {
        const content = this.input.value.trim();
        if (!content) return;
        this.input.value = '';
        this.hidePromptCards();
        await this.engine.sendMessage(content);
    }

    /** Clear all chat messages and re-show prompt cards */
    clearChat(): void {
        this.engine.clearMessages();
        this.messagesContainer.innerHTML = '';
        this.renderPromptCards();
    }

    /** Open the chat panel */
    open(): void {
        this.isOpen = true;
        this.panel.classList.add('open');
        this.fab.classList.add('open');
        this.input.focus();
    }

    /** Close the chat panel */
    close(): void {
        this.isOpen = false;
        this.panel.classList.remove('open');
        this.fab.classList.remove('open');
    }

    /** Toggle the chat panel */
    toggle(): void {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    /** Destroy the widget and clean up */
    destroy(): void {
        this.engine.destroy();
        this.container.remove();
    }

    // ---- Helpers ----

    private scrollToBottom(): void {
        requestAnimationFrame(() => {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        });
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
