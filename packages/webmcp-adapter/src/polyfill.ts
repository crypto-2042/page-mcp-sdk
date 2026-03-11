import type {
  JsonSchema,
  AnthropicMcpToolAnnotations,
  PageMcpToolDefinition,
} from '@page-mcp/protocol';

export interface WebMcpTool {
  name: string;
  title?: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  execute: (input: Record<string, unknown>, client?: unknown) => Promise<unknown>;
  annotations?: AnthropicMcpToolAnnotations;
}

export interface ModelContext {
  provideContext(options?: { tools?: WebMcpTool[] }): void;
  clearContext(): void;
  registerTool(tool: WebMcpTool): void;
  unregisterTool(name: string): void;
}

export function isWebMcpSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'modelContext' in navigator &&
    typeof (navigator as any).modelContext?.registerTool === 'function'
  );
}

export function installWebMcpPolyfill(
  host: {
    registerTool: (def: PageMcpToolDefinition) => unknown;
    unregisterTool?: (name: string) => unknown;
  },
  options?: {
    force?: boolean;
    requestUserInteraction?: (request: unknown) => Promise<unknown>;
  }
): void {
  if (typeof navigator === 'undefined') return;
  const insecureContext = typeof window !== 'undefined' && (window as Window).isSecureContext === false;
  if (insecureContext && !options?.force) return;
  if (isWebMcpSupported() && !options?.force) return;

  const toolMap = new Map<string, WebMcpTool>();
  const modelContextClient = {
    requestUserInteraction: async (request: unknown) =>
      options?.requestUserInteraction
        ? options.requestUserInteraction(request)
        : {
            status: 'not_implemented',
            request,
          },
  };

  const modelContext: ModelContext = {
    provideContext(opts?: { tools?: WebMcpTool[] }) {
      modelContext.clearContext();
      if (opts?.tools) {
        for (const tool of opts.tools) {
          modelContext.registerTool(tool);
        }
      }
    },

    clearContext() {
      if (host.unregisterTool) {
        for (const name of toolMap.keys()) {
          try {
            host.unregisterTool(name);
          } catch {
            // ignored
          }
        }
      }
      toolMap.clear();
    },

    registerTool(tool: WebMcpTool) {
      if (toolMap.has(tool.name)) {
        throw new DOMException(`Tool "${tool.name}" is already registered`, 'InvalidStateError');
      }
      if (!tool.name || !tool.description) {
        throw new DOMException('Tool name and description are required', 'InvalidStateError');
      }

      toolMap.set(tool.name, tool);

      try {
        host.registerTool({
          name: tool.name,
          title: tool.title,
          description: tool.description,
          inputSchema: tool.inputSchema as JsonSchema | undefined,
          outputSchema: tool.outputSchema as JsonSchema | undefined,
          annotations: tool.annotations,
          execute: async (input) => tool.execute(input, modelContextClient),
        });
      } catch {
        // ignored
      }
    },

    unregisterTool(name: string) {
      if (!toolMap.has(name)) {
        throw new DOMException(`Tool "${name}" is not registered`, 'InvalidStateError');
      }
      if (host.unregisterTool) {
        try {
          host.unregisterTool(name);
        } catch {
          // ignored
        }
      }
      toolMap.delete(name);
    },
  };

  Object.defineProperty(navigator, 'modelContext', {
    value: modelContext,
    writable: false,
    configurable: true,
    enumerable: true,
  });
}

export function toWebMcpTool(def: PageMcpToolDefinition): WebMcpTool {
  return {
    name: def.name,
    title: def.title,
    description: def.description,
    inputSchema: def.inputSchema as Record<string, unknown> | undefined,
    outputSchema: def.outputSchema as Record<string, unknown> | undefined,
    execute: async (input) => def.execute(input),
    annotations: def.annotations,
  };
}

export function fromWebMcpTool(tool: WebMcpTool): PageMcpToolDefinition {
  return {
    name: tool.name,
    title: tool.title,
    description: tool.description,
    inputSchema: tool.inputSchema as JsonSchema | undefined,
    outputSchema: tool.outputSchema as JsonSchema | undefined,
    execute: async (input) => tool.execute(input),
    annotations: tool.annotations,
  };
}
