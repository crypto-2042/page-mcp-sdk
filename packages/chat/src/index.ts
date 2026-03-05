// ============================================================
// @page-mcp/chat — Public API
// ============================================================

import { ChatWidget } from './chat-widget.js';
import type { ChatConfig } from './types.js';

export { ChatWidget } from './chat-widget.js';
export { ChatEngine } from './chat-engine.js';
export type {
    ChatConfig,
    ChatPosition,
    ChatExpandMode,
    ChatTheme,
    OpenAIConfig,
    EndpointConfig,
    ChatMessage,
    ToolCallInfo,
    ToolCallStatus,
    MessageRole,
    ChatEngineEvents,
} from './types.js';

let instance: ChatWidget | null = null;

/**
 * Initialize the AI Chat Widget.
 *
 * @example
 * ```js
 * // Script tag usage (IIFE global: PageMcpChat)
 * PageMcpChat.init({
 *   openai: { apiKey: 'sk-xxx' },
 *   theme: 'dark',
 *   position: 'bottom-right',
 * });
 *
 * // ES module usage
 * import { init } from '@page-mcp/chat';
 * init({ openai: { apiKey: 'sk-xxx' } });
 * ```
 */
export function init(config: ChatConfig): ChatWidget {
    if (instance) {
        instance.destroy();
    }
    instance = new ChatWidget(config);
    return instance;
}

/** Get the current widget instance */
export function getInstance(): ChatWidget | null {
    return instance;
}

/** Destroy the current widget */
export function destroy(): void {
    instance?.destroy();
    instance = null;
}
