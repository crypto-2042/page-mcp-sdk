// ============================================================
// @page-mcp/chat — Type Definitions
// ============================================================

/** Position of the floating action button */
export type ChatPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

/** How the chat panel expands */
export type ChatExpandMode = 'popup' | 'slide' | 'fullscreen';

/** Theme mode */
export type ChatTheme = 'dark' | 'light' | 'auto';

/** OpenAI direct connection config */
export interface OpenAIConfig {
    apiKey: string;
    baseURL?: string;
    model?: string;
    /** Stream direct-mode responses via SSE (default: true) */
    stream?: boolean;
    /** Dangerously allow browser-side API calls (required for direct mode) */
    dangerouslyAllowBrowser?: boolean;
}

/** Backend proxy endpoint config */
export interface EndpointConfig {
    /** The URL of the chat endpoint */
    url: string;
    /** Additional headers for the endpoint */
    headers?: Record<string, string>;
}

/** Complete chat widget configuration */
export interface ChatConfig {
    // --- OpenAI ---
    /** Direct OpenAI connection (choose this OR endpoint) */
    openai?: OpenAIConfig;
    /** Backend proxy endpoint (choose this OR openai) */
    endpoint?: EndpointConfig;

    // --- MCP ---
    /** Existing EventBus to connect to page MCP tools (auto-detected if not provided) */
    bus?: import('@page-mcp/core').EventBus;
    /** Resource URIs that should be preselected for explicit attachment */
    defaultAttachedResources?: string[];

    // --- UI ---
    /** FAB position (default: 'bottom-right') */
    position?: ChatPosition;
    /** Expand mode (default: 'popup') */
    expandMode?: ChatExpandMode;
    /** Theme (default: 'dark') */
    theme?: ChatTheme;
    /** Accent color (default: '#6C5CE7') */
    accentColor?: string;
    /** Chat panel title (default: 'AI Assistant') */
    title?: string;
    /** Input placeholder (default: 'Type a message...') */
    placeholder?: string;
    /** Welcome message shown when chat opens */
    welcomeMessage?: string;
    /** System prompt for the AI */
    systemPrompt?: string;
    /** Panel width in px (default: 400) */
    width?: number;
    /** Panel height in px (default: 620) */
    height?: number;
    /** Custom CSS to inject into Shadow DOM */
    customCSS?: string;
    /** FAB icon: 'default' | URL to custom icon */
    fabIcon?: string;
}

/** Message role */
export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

/** Tool call status */
export type ToolCallStatus = 'calling' | 'success' | 'error';

/** A tool call within a message */
export interface ToolCallInfo {
    id: string;
    name: string;
    args: Record<string, unknown>;
    status: ToolCallStatus;
    result?: unknown;
    error?: string;
}

/** A chat message */
export interface ChatMessage {
    id: string;
    role: MessageRole;
    content: string;
    timestamp: number;
    /** Internal context message that should not render as a chat bubble */
    hidden?: boolean;
    /** Tool calls made by the assistant */
    toolCalls?: ToolCallInfo[];
    /** For tool role messages, the tool_call_id */
    toolCallId?: string;
}

/** Events emitted by the chat engine */
export interface ChatEngineEvents {
    'message': (message: ChatMessage) => void;
    'message:update': (message: ChatMessage) => void;
    'message:stream': (messageId: string, chunk: string) => void;
    'toolcall:start': (messageId: string, toolCall: ToolCallInfo) => void;
    'toolcall:end': (messageId: string, toolCall: ToolCallInfo) => void;
    'aborted': () => void;
    'error': (error: Error) => void;
    'loading': (loading: boolean) => void;
}
