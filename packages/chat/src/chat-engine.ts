// ============================================================
// @page-mcp/chat — ChatEngine (Conversation Core)
// ============================================================

// This engine uses raw fetch() for OpenAI API calls instead of
// the openai SDK, to keep the IIFE bundle small and avoid
// the SDK's browser safety check.

import { PageMcpClient, EventBus } from '@page-mcp/core';
import type { AnthropicMcpPrompt, AnthropicMcpResource, AnthropicMcpTool } from '@page-mcp/protocol';
import type {
    ChatConfig,
    ChatMessage,
    ToolCallInfo,
    ChatEngineEvents,
} from './types.js';

type EventHandler<K extends keyof ChatEngineEvents> = ChatEngineEvents[K];

/**
 * ChatEngine manages conversation state and LLM communication.
 *
 * Supports two modes:
 * 1. Direct OpenAI connection (browser-side, via fetch)
 * 2. Backend proxy (sends to a configurable endpoint)
 *
 * Automatically discovers page MCP tools via PageMcpClient and
 * converts them to OpenAI function calling format.
 */
export class ChatEngine {
    private messages: ChatMessage[] = [];
    private mcpClient: PageMcpClient | null = null;
    private mcpTools: AnthropicMcpTool[] = [];
    private mcpResources: AnthropicMcpResource[] = [];
    private mcpPrompts: AnthropicMcpPrompt[] = [];
    private attachedResourceUris: Set<string>;
    private model: string;
    private systemPrompt: string;
    private loading = false;
    private stopRequested = false;
    private currentAbortController: AbortController | null = null;
    private eventHandlers: Map<string, Set<Function>> = new Map();

    // API config
    private apiKey: string | null = null;
    private apiBaseURL: string;
    private endpointUrl: string | null = null;
    private endpointHeaders: Record<string, string> = {};
    private directStream = true;

    constructor(private config: ChatConfig) {
        this.attachedResourceUris = new Set(config.defaultAttachedResources ?? []);
        this.model = config.openai?.model ?? 'gpt-5.2';
        this.systemPrompt = config.systemPrompt ?? 'You are a helpful AI assistant embedded in a web page. You can use the available tools to interact with the page and help the user accomplish tasks.';

        // Setup OpenAI direct mode
        if (config.openai) {
            this.apiKey = config.openai.apiKey;
            this.apiBaseURL = config.openai.baseURL ?? 'https://api.openai.com/v1';
            this.directStream = config.openai.stream ?? true;
        } else {
            this.apiBaseURL = 'https://api.openai.com/v1';
        }

        // Setup endpoint mode
        if (config.endpoint) {
            this.endpointUrl = config.endpoint.url;
            this.endpointHeaders = config.endpoint.headers ?? {};
        }

        // Setup MCP client
        const bus = config.bus ?? new EventBus();
        this.mcpClient = new PageMcpClient({ bus });
    }

    /** Initialize: connect to MCP host and discover tools */
    async init(): Promise<void> {
        if (this.mcpClient) {
            try {
                await this.mcpClient.connect();
                this.mcpTools = await this.mcpClient.listTools();
                try {
                    this.mcpResources = await this.mcpClient.listResources();
                } catch {
                    this.mcpResources = [];
                }
                try {
                    this.mcpPrompts = await this.mcpClient.listPrompts();
                } catch {
                    this.mcpPrompts = [];
                }
            } catch {
                // MCP host may not be available, continue without tools
                this.mcpTools = [];
                this.mcpResources = [];
                this.mcpPrompts = [];
            }
        }

        // Add welcome message if configured
        if (this.config.welcomeMessage) {
            const welcomeMsg: ChatMessage = {
                id: this.genId(),
                role: 'assistant',
                content: this.config.welcomeMessage,
                timestamp: Date.now(),
            };
            this.messages.push(welcomeMsg);
            this.emit('message', welcomeMsg);
        }
    }

    /** Get all messages */
    getMessages(): ChatMessage[] {
        return [...this.messages];
    }

    /** Get available MCP tools */
    getTools(): AnthropicMcpTool[] {
        return [...this.mcpTools];
    }

    /** Get available prompt shortcuts */
    getPrompts(): AnthropicMcpPrompt[] {
        return [...this.mcpPrompts];
    }

    /** Get available MCP resources */
    getResources(): AnthropicMcpResource[] {
        return [...this.mcpResources];
    }

    /** Get currently attached resource URIs */
    getAttachedResourceUris(): string[] {
        return [...this.attachedResourceUris];
    }

    /** Replace the set of attached resource URIs */
    setAttachedResourceUris(uris: string[]): void {
        this.attachedResourceUris = new Set(uris);
    }

    /** Check if currently loading */
    isLoading(): boolean {
        return this.loading;
    }

    /** Abort the active request loop, if any */
    abortActiveRequest(): boolean {
        if (!this.loading) return false;
        this.stopRequested = true;
        this.currentAbortController?.abort();
        return true;
    }

    /** Send a user message and get AI response */
    async sendMessage(content: string): Promise<void> {
        if (!content.trim() || this.loading) return;
        await this.appendAttachedResourcesSnapshot();
        this.appendConversationMessage('user', content.trim());
        await this.requestAssistantResponse();
    }

    /** Resolve a prompt shortcut via MCP and continue the conversation with its messages */
    async applyPromptShortcut(name: string, args?: Record<string, unknown>): Promise<void> {
        if (this.loading) return;
        if (!this.mcpClient) {
            throw new Error('Prompt shortcuts are unavailable because the MCP client is not configured.');
        }

        const promptResult = await this.mcpClient.getPrompt(name, args);
        await this.appendAttachedResourcesSnapshot();
        for (const message of promptResult.messages) {
            if (message.content.type !== 'text') continue;
            this.appendConversationMessage(message.role, message.content.text, message.role !== 'user');
        }

        await this.requestAssistantResponse();
    }

    // ---- Direct OpenAI Mode (via fetch) ----

    private async handleDirectChat(): Promise<void> {
        let openaiMessages = this.buildOpenAIMessages();
        const tools = this.buildOpenAITools();

        let continueLoop = true;
        while (continueLoop) {
            if (this.stopRequested) break;
            continueLoop = false;

            const body: Record<string, unknown> = {
                model: this.model,
                messages: openaiMessages,
                stream: this.directStream,
            };
            if (tools.length > 0) {
                body.tools = tools;
            }

            const response = await fetch(`${this.apiBaseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                signal: this.currentAbortController?.signal,
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errBody = await response.text();
                let errMessage = `OpenAI API error ${response.status}`;
                try {
                    const errJson = JSON.parse(errBody);
                    errMessage = errJson.error?.message ?? errMessage;
                } catch { /* ignore parse errors */ }
                throw new Error(errMessage);
            }

            const { assistantMessage, chatMsg: streamedChatMsg } = this.directStream
                ? await this.readStreamingAssistantMessage(response)
                : await this.readNonStreamingAssistantMessage(response);
            if (!assistantMessage) break;
            if (this.stopRequested) break;

            // Handle tool calls
            if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
                const chatMsg: ChatMessage = streamedChatMsg ?? {
                    id: this.genId(),
                    role: 'assistant',
                    content: assistantMessage.content ?? '',
                    timestamp: Date.now(),
                    toolCalls: [],
                };
                if (!streamedChatMsg) {
                    this.messages.push(chatMsg);
                    this.emit('message', chatMsg);
                }

                // Add assistant message to context
                openaiMessages.push({
                    role: 'assistant',
                    content: assistantMessage.content,
                    tool_calls: assistantMessage.tool_calls,
                });

                // Execute each tool call via MCP
                for (const tc of assistantMessage.tool_calls) {
                    if (this.stopRequested) break;
                    const toolCallInfo: ToolCallInfo = {
                        id: tc.id,
                        name: tc.function.name,
                        args: JSON.parse(tc.function.arguments || '{}'),
                        status: 'calling',
                    };
                    chatMsg.toolCalls!.push(toolCallInfo);
                    this.emit('toolcall:start', chatMsg.id, toolCallInfo);

                    try {
                        const result = await this.mcpClient!.callTool(
                            tc.function.name,
                            JSON.parse(tc.function.arguments || '{}')
                        );
                        toolCallInfo.status = 'success';
                        toolCallInfo.result = result;

                        openaiMessages.push({
                            role: 'tool',
                            tool_call_id: tc.id,
                            content: JSON.stringify(result),
                        });
                    } catch (err) {
                        toolCallInfo.status = 'error';
                        toolCallInfo.error = err instanceof Error ? err.message : String(err);

                        openaiMessages.push({
                            role: 'tool',
                            tool_call_id: tc.id,
                            content: JSON.stringify({ error: toolCallInfo.error }),
                        });
                    }

                    this.emit('toolcall:end', chatMsg.id, toolCallInfo);
                    this.emit('message:update', chatMsg);
                }

                // Continue the loop to get AI's response after tool calls
                continueLoop = !this.stopRequested;
            } else {
                // Regular text response
                if (!streamedChatMsg) {
                    const chatMsg: ChatMessage = {
                        id: this.genId(),
                        role: 'assistant',
                        content: assistantMessage.content ?? '',
                        timestamp: Date.now(),
                    };
                    this.messages.push(chatMsg);
                    this.emit('message', chatMsg);
                }
            }
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async readNonStreamingAssistantMessage(response: Response): Promise<{ assistantMessage: any | null; chatMsg: ChatMessage | null }> {
        const data = await response.json();
        const choice = data.choices?.[0];
        return { assistantMessage: choice?.message ?? null, chatMsg: null };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async readStreamingAssistantMessage(response: Response): Promise<{ assistantMessage: any | null; chatMsg: ChatMessage | null }> {
        if (!response.body) {
            throw new Error('Streaming response body is empty');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let done = false;
        let assistantContent = '';
        const toolCallsByIndex = new Map<number, {
            id: string;
            type: 'function';
            function: { name: string; arguments: string; };
        }>();
        let chatMsg: ChatMessage | null = null;

        const ensureChatMessage = (): ChatMessage => {
            if (chatMsg) return chatMsg;
            chatMsg = {
                id: this.genId(),
                role: 'assistant',
                content: '',
                timestamp: Date.now(),
                toolCalls: [],
            };
            this.messages.push(chatMsg);
            this.emit('message', chatMsg);
            return chatMsg;
        };

        const handleDelta = (delta: Record<string, unknown>): void => {
            const content = typeof delta.content === 'string' ? delta.content : '';
            if (content) {
                const msg = ensureChatMessage();
                assistantContent += content;
                msg.content += content;
                this.emit('message:stream', msg.id, content);
                this.emit('message:update', msg);
            }

            if (Array.isArray(delta.tool_calls)) {
                const msg = ensureChatMessage();
                for (const rawCall of delta.tool_calls) {
                    if (!rawCall || typeof rawCall !== 'object') continue;
                    const call = rawCall as {
                        index?: number;
                        id?: string;
                        function?: { name?: string; arguments?: string; };
                    };
                    const idx = Number.isFinite(call.index) ? Number(call.index) : 0;
                    const existing = toolCallsByIndex.get(idx) ?? {
                        id: '',
                        type: 'function' as const,
                        function: { name: '', arguments: '' },
                    };

                    if (typeof call.id === 'string' && call.id) {
                        existing.id = call.id;
                    }
                    if (typeof call.function?.name === 'string') {
                        existing.function.name += call.function.name;
                    }
                    if (typeof call.function?.arguments === 'string') {
                        existing.function.arguments += call.function.arguments;
                    }

                    toolCallsByIndex.set(idx, existing);
                }
                this.emit('message:update', msg);
            }
        };

        while (!done) {
            const read = await reader.read();
            done = read.done;
            buffer += decoder.decode(read.value ?? new Uint8Array(), { stream: !done });

            let boundary = buffer.indexOf('\n\n');
            while (boundary >= 0) {
                const block = buffer.slice(0, boundary).trim();
                buffer = buffer.slice(boundary + 2);
                boundary = buffer.indexOf('\n\n');

                if (!block) continue;
                const lines = block.split('\n');
                const dataLines = lines
                    .filter((line) => line.startsWith('data:'))
                    .map((line) => line.slice(5).trim());
                if (dataLines.length === 0) continue;

                const payload = dataLines.join('\n');
                if (payload === '[DONE]') {
                    done = true;
                    break;
                }

                let chunk: any;
                try {
                    chunk = JSON.parse(payload);
                } catch {
                    continue;
                }

                const delta = chunk?.choices?.[0]?.delta;
                if (delta && typeof delta === 'object') {
                    handleDelta(delta as Record<string, unknown>);
                }
            }
        }

        const toolCalls = [...toolCallsByIndex.entries()]
            .sort((a, b) => a[0] - b[0])
            .map(([, call]) => ({
                ...call,
                id: call.id || this.genId(),
            }));

        if (!chatMsg && toolCalls.length === 0) {
            return { assistantMessage: null, chatMsg: null };
        }

        return {
            assistantMessage: {
                content: assistantContent,
                tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
            },
            chatMsg,
        };
    }

    // ---- Backend Proxy Mode ----

    private async handleEndpointChat(): Promise<void> {
        if (this.stopRequested) return;
        const tools = this.buildOpenAITools();
        const body: Record<string, unknown> = {
            messages: this.buildOpenAIMessages(),
            model: this.model,
        };
        if (tools.length > 0) {
            body.tools = tools;
        }

        const response = await fetch(this.endpointUrl!, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...this.endpointHeaders,
            },
            signal: this.currentAbortController?.signal,
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(`Endpoint returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const choice = data.choices?.[0];
        if (!choice) {
            throw new Error('Invalid response from endpoint');
        }

        const message = choice.message;
        if (this.stopRequested) return;

        // Handle tool calls from proxy response
        if (message.tool_calls && message.tool_calls.length > 0) {
            const chatMsg: ChatMessage = {
                id: this.genId(),
                role: 'assistant',
                content: message.content ?? '',
                timestamp: Date.now(),
                toolCalls: [],
            };
            this.messages.push(chatMsg);
            this.emit('message', chatMsg);

            for (const tc of message.tool_calls) {
                if (this.stopRequested) break;
                const toolCallInfo: ToolCallInfo = {
                    id: tc.id,
                    name: tc.function.name,
                    args: JSON.parse(tc.function.arguments || '{}'),
                    status: 'calling',
                };
                chatMsg.toolCalls!.push(toolCallInfo);
                this.emit('toolcall:start', chatMsg.id, toolCallInfo);

                try {
                    const result = await this.mcpClient!.callTool(
                        tc.function.name,
                        JSON.parse(tc.function.arguments || '{}')
                    );
                    toolCallInfo.status = 'success';
                    toolCallInfo.result = result;
                } catch (err) {
                    toolCallInfo.status = 'error';
                    toolCallInfo.error = err instanceof Error ? err.message : String(err);
                }

                this.emit('toolcall:end', chatMsg.id, toolCallInfo);
                this.emit('message:update', chatMsg);
            }

            // After tool calls, send results back to proxy
            if (!this.stopRequested) {
                await this.handleEndpointChat();
            }
        } else {
            const chatMsg: ChatMessage = {
                id: this.genId(),
                role: 'assistant',
                content: message.content ?? '',
                timestamp: Date.now(),
            };
            this.messages.push(chatMsg);
            this.emit('message', chatMsg);
        }
    }

    // ---- Helpers ----

    private appendConversationMessage(role: ChatMessage['role'], content: string, hidden = false): void {
        const message: ChatMessage = {
            id: this.genId(),
            role,
            content,
            timestamp: Date.now(),
            hidden,
        };
        this.messages.push(message);
        this.emit('message', message);
    }

    private async requestAssistantResponse(): Promise<void> {
        this.stopRequested = false;
        this.currentAbortController = typeof AbortController !== 'undefined' ? new AbortController() : null;
        this.setLoading(true);

        try {
            if (this.apiKey) {
                await this.handleDirectChat();
            } else if (this.endpointUrl) {
                await this.handleEndpointChat();
            } else {
                throw new Error('No OpenAI config or endpoint configured. Please provide openai.apiKey or endpoint.url.');
            }
        } catch (err) {
            if (this.isAbortError(err)) {
                this.emit('aborted');
                return;
            }
            const error = err instanceof Error ? err : new Error(String(err));
            this.emit('error', error);

            const errorMsg: ChatMessage = {
                id: this.genId(),
                role: 'assistant',
                content: `⚠️ Error: ${error.message}`,
                timestamp: Date.now(),
            };
            this.messages.push(errorMsg);
            this.emit('message', errorMsg);
        } finally {
            this.currentAbortController = null;
            this.setLoading(false);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private buildOpenAIMessages(): any[] {
        const msgs: any[] = [];

        // System prompt
        msgs.push({ role: 'system', content: this.systemPrompt });

        // Conversation messages
        for (const msg of this.messages) {
            if (msg.role === 'system') {
                msgs.push({ role: 'system', content: msg.content });
            } else if (msg.role === 'user') {
                msgs.push({ role: 'user', content: msg.content });
            } else if (msg.role === 'assistant') {
                if (msg.toolCalls && msg.toolCalls.length > 0) {
                    msgs.push({
                        role: 'assistant',
                        content: msg.content || null,
                        tool_calls: msg.toolCalls.map(tc => ({
                            id: tc.id,
                            type: 'function' as const,
                            function: {
                                name: tc.name,
                                arguments: JSON.stringify(tc.args),
                            },
                        })),
                    });
                    for (const tc of msg.toolCalls) {
                        msgs.push({
                            role: 'tool',
                            tool_call_id: tc.id,
                            content: tc.status === 'success'
                                ? JSON.stringify(tc.result)
                                : JSON.stringify({ error: tc.error }),
                        });
                    }
                } else {
                    msgs.push({ role: 'assistant', content: msg.content });
                }
            }
        }

        return msgs;
    }

    private async appendAttachedResourcesSnapshot(): Promise<void> {
        const resourceAttachmentMessage = await this.buildAttachedResourcesMessage();
        if (!resourceAttachmentMessage) return;
        this.appendConversationMessage('system', resourceAttachmentMessage, true);
    }

    private async buildAttachedResourcesMessage(): Promise<string | null> {
        if (!this.mcpClient || this.attachedResourceUris.size === 0) {
            return null;
        }

        const sections: string[] = [];
        for (const uri of this.attachedResourceUris) {
            const resource = this.mcpResources.find((item) => item.uri === uri);
            try {
                const result = await this.mcpClient.readResource(uri);
                const contentText = result.contents
                    .map((content) => content.text ?? content.blob ?? '')
                    .filter(Boolean)
                    .join('\n');
                if (!contentText) continue;
                sections.push(`[${resource?.name ?? uri}]\n${contentText}`);
            } catch {
                continue;
            }
        }

        if (sections.length === 0) {
            return null;
        }

        return `Attached page resources for this conversation turn:\n\n${sections.join('\n\n')}`;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private buildOpenAITools(): any[] {
        return this.mcpTools.map(tool => ({
            type: 'function' as const,
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.inputSchema ?? { type: 'object', properties: {} },
            },
        }));
    }

    private setLoading(loading: boolean): void {
        this.loading = loading;
        this.emit('loading', loading);
    }

    private isAbortError(err: unknown): boolean {
        return err instanceof DOMException
            ? err.name === 'AbortError'
            : err instanceof Error && err.name === 'AbortError';
    }

    private genId(): string {
        return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }

    // ---- Simple Event Emitter ----

    on<K extends keyof ChatEngineEvents>(event: K, handler: EventHandler<K>): void {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, new Set());
        }
        this.eventHandlers.get(event)!.add(handler);
    }

    off<K extends keyof ChatEngineEvents>(event: K, handler: EventHandler<K>): void {
        this.eventHandlers.get(event)?.delete(handler);
    }

    private emit<K extends keyof ChatEngineEvents>(
        event: K,
        ...args: Parameters<ChatEngineEvents[K]>
    ): void {
        this.eventHandlers.get(event)?.forEach((handler) => {
            try {
                (handler as Function)(...args);
            } catch (err) {
                console.error(`[PageMcpChat] Event handler error (${event}):`, err);
            }
        });
    }

    /** Clear all messages and re-add welcome message */
    clearMessages(): void {
        this.messages = [];
        if (this.config.welcomeMessage) {
            const welcomeMsg: ChatMessage = {
                id: this.genId(),
                role: 'assistant',
                content: this.config.welcomeMessage,
                timestamp: Date.now(),
            };
            this.messages.push(welcomeMsg);
            this.emit('message', welcomeMsg);
        }
    }

    /** Clean up */
    destroy(): void {
        this.eventHandlers.clear();
        this.mcpClient?.disconnect();
    }
}
