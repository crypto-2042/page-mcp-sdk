// ============================================================
// @page-mcp/chat — ChatWidget (Shadow DOM UI Component)
// ============================================================

import { ChatEngine } from './chat-engine.js';
import { generateStyles } from './styles.js';
import { renderMarkdown } from './markdown.js';
import type { ChatConfig, ChatMessage, ChatTheme, ToolCallInfo } from './types.js';
import type { AnthropicMcpPrompt, AnthropicMcpResource } from '@page-mcp/protocol';

// SVG icons
const ICON_CHAT = `<svg viewBox="0 0 24 24" class="mcp-fab-icon"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.82.49 3.53 1.34 5L2 22l5-1.34C8.47 21.51 10.18 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.62 0-3.13-.46-4.42-1.24l-.31-.18-3.22.85.85-3.22-.18-.31A7.963 7.963 0 014 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z"/><circle cx="8" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="16" cy="12" r="1.2"/></svg>`;
const ICON_CLOSE = `✕`;
const ICON_SEND = `<svg viewBox="0 0 24 24" class="mcp-send-icon"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`;
const ICON_STOP = `<svg viewBox="0 0 24 24" class="mcp-send-icon"><path d="M7 7h10v10H7z"/></svg>`;
const ICON_TOOL = `<svg viewBox="0 0 24 24" class="mcp-tool-icon"><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/></svg>`;
const ICON_CLEAR = `<svg viewBox="0 0 24 24" class="mcp-clear-icon"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`;
const ICON_RESOURCE = `<svg viewBox="0 0 24 24" class="mcp-resource-icon"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zm0 2.3L6 8.4v6.2l6 3.1 6-3.1V8.4l-6-3.1zm-1 3.7h2v5h-2V9zm0 6h2v2h-2v-2z"/></svg>`;
const ICON_CHEVRON = `<svg viewBox="0 0 24 24" class="mcp-tool-toggle-icon"><path d="M8.12 9.29a1 1 0 0 1 1.41 0L12 11.76l2.47-2.47a1 1 0 1 1 1.41 1.42l-3.18 3.17a1 1 0 0 1-1.41 0L8.12 10.7a1 1 0 0 1 0-1.41z"/></svg>`;
const ICON_THEME_LIGHT = `<svg viewBox="0 0 24 24" class="mcp-header-icon"><path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zm0 4a1 1 0 0 1-1-1v-1a1 1 0 1 1 2 0v1a1 1 0 0 1-1 1zm0-18a1 1 0 0 1-1-1V2a1 1 0 1 1 2 0v1a1 1 0 0 1-1 1zm10 9a1 1 0 1 1 0-2h-1a1 1 0 1 1 0 2h1zM4 12a1 1 0 1 1 0-2H3a1 1 0 1 1 0 2h1zm14.36 7.78a1 1 0 0 1-1.41 0l-.7-.71a1 1 0 1 1 1.41-1.41l.7.7a1 1 0 0 1 0 1.42zM7.75 8.16a1 1 0 0 1-1.41 0l-.7-.7a1 1 0 1 1 1.41-1.42l.7.71a1 1 0 0 1 0 1.41zm10.61-1.41a1 1 0 0 1 0-1.41l.7-.71a1 1 0 1 1 1.41 1.42l-.7.7a1 1 0 0 1-1.41 0zM7.75 19.2a1 1 0 0 1 0-1.42l.7-.7a1 1 0 1 1 1.41 1.41l-.7.71a1 1 0 0 1-1.41 0z"/></svg>`;
const ICON_THEME_DARK = `<svg viewBox="0 0 24 24" class="mcp-header-icon"><path d="M21 12.8A9 9 0 0 1 11.2 3 9 9 0 1 0 21 12.8z"/></svg>`;

export function isPromptShortcutEligible(prompt: AnthropicMcpPrompt): boolean {
    return !prompt.arguments?.some((argument) => argument.required);
}

export function getInitialAttachedResourceUris(
    resources: AnthropicMcpResource[],
    defaultAttachedResources: string[] = []
): string[] {
    const allowed = new Set(resources.map((resource) => resource.uri));
    return defaultAttachedResources.filter((uri) => allowed.has(uri));
}

/**
 * ChatWidget renders the complete chat interface inside Shadow DOM.
 */
export class ChatWidget {
    private container: HTMLDivElement;
    private shadowRoot: ShadowRoot;
    private styleEl!: HTMLStyleElement;
    private engine: ChatEngine;
    private config: Required<Pick<ChatConfig, 'position' | 'expandMode' | 'theme' | 'accentColor' | 'title' | 'placeholder' | 'width' | 'height'>> & ChatConfig;
    private currentTheme: ChatTheme;
    private isOpen = false;
    /** Max number of prompt shortcut cards to display */
    private maxPrompts = 3;

    // DOM references
    private fab!: HTMLButtonElement;
    private panel!: HTMLDivElement;
    private messagesContainer!: HTMLDivElement;
    private promptsContainer!: HTMLDivElement;
    private resourcePanel!: HTMLDivElement;
    private input!: HTMLInputElement;
    private sendBtn!: HTMLButtonElement;
    private loadingEl!: HTMLDivElement;
    private resourceToggleBtn!: HTMLButtonElement;
    private themeToggleBtn!: HTMLButtonElement;

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
        this.currentTheme = this.config.theme;

        this.engine = new ChatEngine(config);

        // Create Shadow DOM container
        this.container = document.createElement('div');
        this.container.id = 'page-mcp-chat-widget';
        this.shadowRoot = this.container.attachShadow({ mode: 'open' });

        // Load Inter font
        this.loadFont();

        // Inject styles
        this.styleEl = document.createElement('style');
        this.styleEl.textContent = generateStyles(this.currentTheme, this.config.accentColor);
        if (this.config.customCSS) {
            this.styleEl.textContent += '\n' + this.config.customCSS;
        }
        this.shadowRoot.appendChild(this.styleEl);

        // Build UI
        this.buildFAB();
        this.buildPanel();

        // Bind engine events
        this.bindEngineEvents();

        // Mount to DOM
        document.body.appendChild(this.container);

        // Initialize engine then render prompts/resources
        this.engine.init().then(() => {
            this.renderPromptCards();
            this.initializeResourceSelection();
            this.renderResourcePanel();
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
                    <button class="mcp-theme-btn" aria-label="Switch theme (current: ${this.currentTheme})" title="Switch theme (current: ${this.currentTheme})">${this.getThemeToggleIcon()}</button>
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
            <div class="mcp-resource-panel" style="display:none"></div>
            <div class="mcp-input-area">
                <button class="mcp-resource-toggle-btn" type="button" aria-label="Attach resources" title="Attach resources">
                    ${ICON_RESOURCE}
                    <span class="mcp-resource-count" style="display:none">0</span>
                </button>
                <input class="mcp-input" type="text" placeholder="${this.escapeHtml(this.config.placeholder)}" autocomplete="off">
                <button class="mcp-send-btn" aria-label="Send message" title="Send message">${ICON_SEND}</button>
            </div>
        `;

        // Cache DOM refs
        this.messagesContainer = this.panel.querySelector('.mcp-messages')!;
        this.resourcePanel = this.panel.querySelector('.mcp-resource-panel')!;
        this.input = this.panel.querySelector('.mcp-input')!;
        this.sendBtn = this.panel.querySelector('.mcp-send-btn')!;
        this.loadingEl = this.panel.querySelector('.mcp-loading')!;
        this.resourceToggleBtn = this.panel.querySelector('.mcp-resource-toggle-btn')!;
        this.themeToggleBtn = this.panel.querySelector('.mcp-theme-btn')!;

        // Bind events
        this.panel.querySelector('.mcp-close-btn')!.addEventListener('click', () => this.close());
        this.panel.querySelector('.mcp-clear-btn')!.addEventListener('click', () => this.clearChat());
        this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
        this.resourceToggleBtn.addEventListener('click', () => this.toggleResourcePanel());
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
        const prompts = this.engine.getPrompts().filter(isPromptShortcutEligible);
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
            card.innerHTML = this.escapeHtml(prompt.name);
            card.setAttribute('title', prompt.description);
            card.addEventListener('click', () => {
                this.hidePromptCards();
                void this.engine.applyPromptShortcut(prompt.name);
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

    private initializeResourceSelection(): void {
        const initialUris = getInitialAttachedResourceUris(
            this.engine.getResources(),
            this.config.defaultAttachedResources ?? []
        );
        this.engine.setAttachedResourceUris(initialUris);
        this.updateResourceToggleLabel();
    }

    private toggleResourcePanel(): void {
        this.resourcePanel.style.display = this.resourcePanel.style.display === 'none' ? 'block' : 'none';
    }

    private renderResourcePanel(): void {
        const resources = this.engine.getResources();
        this.updateResourceToggleLabel();

        if (resources.length === 0) {
            this.resourcePanel.innerHTML = `<div class="mcp-resource-empty">No page resources available.</div>`;
            return;
        }

        const selected = new Set(this.engine.getAttachedResourceUris());
        this.resourcePanel.innerHTML = '';

        for (const resource of resources) {
            const label = document.createElement('label');
            label.className = 'mcp-resource-option';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'mcp-resource-checkbox';
            checkbox.checked = selected.has(resource.uri);
            checkbox.addEventListener('change', () => {
                const next = new Set(this.engine.getAttachedResourceUris());
                if (checkbox.checked) next.add(resource.uri);
                else next.delete(resource.uri);
                this.engine.setAttachedResourceUris([...next]);
                this.updateResourceToggleLabel();
            });

            const meta = document.createElement('div');
            meta.className = 'mcp-resource-meta';
            meta.innerHTML = `<div class="mcp-resource-name">${this.escapeHtml(resource.name)}</div>`;

            label.appendChild(checkbox);
            label.appendChild(meta);
            this.resourcePanel.appendChild(label);
        }
    }

    private updateResourceToggleLabel(): void {
        const count = this.engine.getAttachedResourceUris().length;
        const badge = this.resourceToggleBtn.querySelector('.mcp-resource-count');
        if (!(badge instanceof HTMLSpanElement)) return;
        badge.textContent = String(count);
        badge.style.display = count > 0 ? 'inline-flex' : 'none';
        this.resourceToggleBtn.setAttribute('aria-label', count > 0 ? `Attach resources (${count} selected)` : 'Attach resources');
        this.resourceToggleBtn.setAttribute('title', count > 0 ? `Attach resources (${count} selected)` : 'Attach resources');
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
            this.sendBtn.disabled = false;
            this.input.disabled = loading;
            this.sendBtn.innerHTML = loading ? ICON_STOP : ICON_SEND;
            this.sendBtn.classList.toggle('stop-mode', loading);
            this.sendBtn.setAttribute('aria-label', loading ? 'Stop response' : 'Send message');
            this.sendBtn.setAttribute('title', loading ? 'Stop response' : 'Send message');
            if (loading) this.scrollToBottom();
        });

        this.engine.on('aborted', () => {
            this.input.focus();
        });

        this.engine.on('error', (err) => {
            console.error('[PageMcpChat]', err);
        });
    }

    // ---- Render Messages ----

    private renderMessage(msg: ChatMessage): void {
        if (!this.shouldRenderMessage(msg)) return;

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
        if (!el) {
            if (this.shouldRenderMessage(msg)) {
                this.renderMessage(msg);
            }
            return;
        }

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
                <button class="mcp-tool-toggle" type="button" aria-label="Expand tool result" aria-expanded="false" title="Expand tool result" hidden>
                    ${ICON_CHEVRON}
                </button>
            </div>
            <div class="mcp-tool-result-wrap" hidden>
                <div class="mcp-tool-args-section">
                    <div class="mcp-tool-args-label">Input</div>
                    <div class="mcp-tool-args">${this.escapeHtml(JSON.stringify(toolCall.args, null, 2))}</div>
                </div>
                <div class="mcp-tool-result-label"></div>
                <div class="mcp-tool-result"></div>
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
        const toggleBtn = card.querySelector('.mcp-tool-toggle');
        const resultWrap = card.querySelector('.mcp-tool-result-wrap');
        const resultLabel = card.querySelector('.mcp-tool-result-label');
        const resultEl = card.querySelector('.mcp-tool-result');
        if (
            !(toggleBtn instanceof HTMLButtonElement) ||
            !(resultWrap instanceof HTMLDivElement) ||
            !(resultLabel instanceof HTMLDivElement) ||
            !(resultEl instanceof HTMLDivElement)
        ) return;

        if (toolCall.status === 'success' && toolCall.result !== undefined) {
            const resultStr = typeof toolCall.result === 'string'
                ? toolCall.result
                : JSON.stringify(toolCall.result, null, 2);
            resultLabel.textContent = 'Result';
            resultEl.textContent = resultStr.length > 300 ? resultStr.slice(0, 300) + '...' : resultStr;
            this.enableToolResultToggle(toggleBtn, resultWrap);
        } else if (toolCall.status === 'error' && toolCall.error) {
            resultLabel.textContent = 'Error';
            resultEl.textContent = `Error: ${toolCall.error}`;
            this.enableToolResultToggle(toggleBtn, resultWrap);
        }
    }

    private enableToolResultToggle(toggleBtn: HTMLButtonElement, resultWrap: HTMLDivElement): void {
        if (toggleBtn.dataset.bound !== 'true') {
            toggleBtn.addEventListener('click', () => {
                const expanded = toggleBtn.getAttribute('aria-expanded') === 'true';
                toggleBtn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
                toggleBtn.setAttribute('aria-label', expanded ? 'Expand tool result' : 'Collapse tool result');
                toggleBtn.setAttribute('title', expanded ? 'Expand tool result' : 'Collapse tool result');
                resultWrap.hidden = expanded;
            });
            toggleBtn.dataset.bound = 'true';
        }
        toggleBtn.hidden = false;
        toggleBtn.setAttribute('aria-expanded', 'false');
        toggleBtn.setAttribute('aria-label', 'Expand tool result');
        toggleBtn.setAttribute('title', 'Expand tool result');
        resultWrap.hidden = true;
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
        if (this.engine.isLoading()) {
            this.engine.abortActiveRequest();
            return;
        }
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

    private shouldRenderMessage(msg: ChatMessage): boolean {
        if (msg.hidden) return false;
        return msg.role === 'user' || msg.content.trim().length > 0;
    }

    private toggleTheme(): void {
        this.currentTheme = this.resolveNextTheme();
        this.styleEl.textContent = generateStyles(this.currentTheme, this.config.accentColor)
            + (this.config.customCSS ? '\n' + this.config.customCSS : '');
        this.themeToggleBtn.innerHTML = this.getThemeToggleIcon();
        this.themeToggleBtn.setAttribute('title', `Switch theme (current: ${this.currentTheme})`);
        this.themeToggleBtn.setAttribute('aria-label', `Switch theme (current: ${this.currentTheme})`);
    }

    private resolveNextTheme(): ChatTheme {
        return this.currentTheme === 'light' ? 'dark' : 'light';
    }

    private getThemeToggleIcon(): string {
        return this.currentTheme === 'light' ? ICON_THEME_DARK : ICON_THEME_LIGHT;
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
