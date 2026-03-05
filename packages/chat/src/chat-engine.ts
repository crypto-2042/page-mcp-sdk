// ============================================================
// @page-mcp/chat — ChatEngine (Conversation Core)
// ============================================================

// This engine uses raw fetch() for OpenAI API calls instead of
// the openai SDK, to keep the IIFE bundle small and avoid
// the SDK's browser safety check.

import { PageMcpClient, EventBus } from '@page-mcp/core';
import type { ToolInfo } from '@page-mcp/core';
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
    private mcpTools: ToolInfo[] = [];
    private model: string;
    private systemPrompt: string;
    private loading = false;
    private eventHandlers: Map<string, Set<Function>> = new Map();

    // API config
    private apiKey: string | null = null;
    private apiBaseURL: string;
    private endpointUrl: string | null = null;
    private endpointHeaders: Record<string, string> = {};

    constructor(private config: ChatConfig) {
        this.model = config.openai?.model ?? 'gpt-4o';
        this.systemPrompt = config.systemPrompt ?? 'You are a helpful AI assistant embedded in a web page. You can use the available tools to interact with the page and help the user accomplish tasks.';

        // Setup OpenAI direct mode
        if (config.openai) {
            this.apiKey = config.openai.apiKey;
            this.apiBaseURL = config.openai.baseURL ?? 'https://api.openai.com/v1';
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
            } catch {
                // MCP host may not be available, continue without tools
                this.mcpTools = [];
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
    getTools(): ToolInfo[] {
        return [...this.mcpTools];
    }

    /** Check if currently loading */
    isLoading(): boolean {
        return this.loading;
    }

    /** Send a user message and get AI response */
    async sendMessage(content: string): Promise<void> {
        if (!content.trim() || this.loading) return;

        // Add user message
        const userMsg: ChatMessage = {
            id: this.genId(),
            role: 'user',
            content: content.trim(),
            timestamp: Date.now(),
        };
        this.messages.push(userMsg);
        this.emit('message', userMsg);

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
            this.setLoading(false);
        }
    }

    // ---- Direct OpenAI Mode (via fetch) ----

    private async handleDirectChat(): Promise<void> {
        let openaiMessages = this.buildOpenAIMessages();
        const tools = this.buildOpenAITools();

        let continueLoop = true;
        while (continueLoop) {
            continueLoop = false;

            const body: Record<string, unknown> = {
                model: this.model,
                messages: openaiMessages,
                stream: false,
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

            const data = await response.json();
            const choice = data.choices?.[0];
            if (!choice) break;

            const assistantMessage = choice.message;

            // Handle tool calls
            if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
                const chatMsg: ChatMessage = {
                    id: this.genId(),
                    role: 'assistant',
                    content: assistantMessage.content ?? '',
                    timestamp: Date.now(),
                    toolCalls: [],
                };
                this.messages.push(chatMsg);
                this.emit('message', chatMsg);

                // Add assistant message to context
                openaiMessages.push({
                    role: 'assistant',
                    content: assistantMessage.content,
                    tool_calls: assistantMessage.tool_calls,
                });

                // Execute each tool call via MCP
                for (const tc of assistantMessage.tool_calls) {
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
                continueLoop = true;
            } else {
                // Regular text response
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

    // ---- Backend Proxy Mode ----

    private async handleEndpointChat(): Promise<void> {
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
            await this.handleEndpointChat();
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private buildOpenAIMessages(): any[] {
        const msgs: any[] = [];

        // System prompt
        msgs.push({ role: 'system', content: this.systemPrompt });

        // Add MCP context
        if (this.mcpTools.length > 0) {
            const toolsList = this.mcpTools.map(t => `- ${t.name}: ${t.description}`).join('\n');
            msgs.push({
                role: 'system',
                content: `You have access to the following page tools:\n${toolsList}\n\nUse these tools when the user's request relates to the page functionality.`,
            });
        }

        // Conversation messages
        for (const msg of this.messages) {
            if (msg.role === 'user') {
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

    /** Clean up */
    destroy(): void {
        this.eventHandlers.clear();
        this.mcpClient?.disconnect();
    }
}
