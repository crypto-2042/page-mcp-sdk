// ============================================================
// @page-mcp/vue3 — Vue 3 Adapter for Page MCP SDK
// ============================================================

import {
    defineComponent,
    provide,
    inject,
    onMounted,
    onUnmounted,
    ref,
    type InjectionKey,
    type App,
    type Plugin,
    h,
} from 'vue';

import {
    Extensions,
    PageMcpHost,
    PageMcpClient,
    EventBus,
    type SkillDefinition,
    type PromptDefinition,
    type HostInfo,
} from '@page-mcp/core';
import type {
    PageMcpToolDefinition,
    PageMcpResourceDefinition,
    PageMcpPromptDefinition,
    AnthropicMcpTool,
    AnthropicMcpResource,
    AnthropicMcpPrompt,
} from '@page-mcp/protocol';

// ------ Injection Keys ------

interface PageMcpInjection {
    host: PageMcpHost;
    client: PageMcpClient;
    bus: EventBus;
    hostInfo: HostInfo;
}

const PAGE_MCP_KEY: InjectionKey<PageMcpInjection> = Symbol('page-mcp');

// ------ Plugin ------

export interface PageMcpPluginOptions {
    name: string;
    version: string;
    bus?: EventBus;
}

/**
 * Vue 3 Plugin. Install globally:
 *
 * ```ts
 * import { PageMcpPlugin } from '@page-mcp/vue3';
 * app.use(PageMcpPlugin, { name: 'my-app', version: '1.0' });
 * ```
 */
export const PageMcpPlugin: Plugin = {
    install(app: App, options: PageMcpPluginOptions) {
        const bus = options.bus ?? new EventBus();
        const host = new PageMcpHost({ name: options.name, version: options.version, bus });
        const client = new PageMcpClient({ bus });
        const hostInfo: HostInfo = { name: options.name, version: options.version };

        host.start();
        client.connect();

        const injection: PageMcpInjection = { host, client, bus, hostInfo };

        app.provide(PAGE_MCP_KEY, injection);

        // Expose globally via app.config.globalProperties
        app.config.globalProperties.$pageMcp = injection;
    },
};

// ------ Provider Component ------

/**
 * Provider component (alternative to plugin).
 * Use when you only want MCP in a subtree of your app.
 *
 * ```vue
 * <PageMcpProvider name="my-app" version="1.0">
 *   <MyComponent />
 * </PageMcpProvider>
 * ```
 */
export const PageMcpProvider = defineComponent({
    name: 'PageMcpProvider',
    props: {
        name: { type: String, required: true },
        version: { type: String, required: true },
    },
    setup(props, { slots }) {
        const bus = new EventBus();
        const host = new PageMcpHost({ name: props.name, version: props.version, bus });
        const client = new PageMcpClient({ bus });
        const hostInfo: HostInfo = { name: props.name, version: props.version };
        const connected = ref(false);

        host.start();

        onMounted(async () => {
            await client.connect();
            connected.value = true;
        });

        onUnmounted(() => {
            host.destroy();
            client.disconnect();
        });

        provide(PAGE_MCP_KEY, { host, client, bus, hostInfo });

        return () => slots.default?.();
    },
});

// ------ Composables ------

function usePageMcpInjection(): PageMcpInjection {
    const injection = inject(PAGE_MCP_KEY);
    if (!injection) {
        throw new Error('usePageMcp* composables require <PageMcpProvider> or PageMcpPlugin');
    }
    return injection;
}

/**
 * Get the PageMcpHost instance.
 */
export function usePageMcpHost(): PageMcpHost {
    return usePageMcpInjection().host;
}

/**
 * Get the PageMcpClient instance.
 */
export function usePageMcpClient(): PageMcpClient {
    return usePageMcpInjection().client;
}

/**
 * Get the EventBus instance.
 */
export function usePageMcpBus(): EventBus {
    return usePageMcpInjection().bus;
}

/**
 * Register a Tool on the Host. Automatically registers on mount.
 *
 * ```ts
 * useRegisterTool({
 *   name: 'search',
 *   description: 'Search products',
 *   inputSchema: { type: 'object', properties: { q: { type: 'string' } } },
 *   execute: async (input) => searchProducts(input.q as string),
 * });
 * ```
 */
export function useRegisterTool(definition: PageMcpToolDefinition): void {
    const host = usePageMcpHost();
    onMounted(() => {
        try {
            host.registerTool(definition);
        } catch {
            // Already registered
        }
    });
    onUnmounted(() => {
        try {
            host.unregisterTool(definition.name);
        } catch {
            // Already unregistered
        }
    });
}

/**
 * Register a Resource on the Host.
 */
export function useRegisterResource(definition: PageMcpResourceDefinition): void {
    const host = usePageMcpHost();
    onMounted(() => {
        try {
            host.registerResource(definition);
        } catch {
            // Already registered
        }
    });
    onUnmounted(() => {
        try {
            host.unregisterResource(definition.uri);
        } catch {
            // Already unregistered
        }
    });
}

/**
 * Register a Skill on the Host.
 */
export function useRegisterSkill(definition: SkillDefinition): void {
    const host = usePageMcpHost();
    onMounted(() => {
        try {
            host.registerSkill(definition);
        } catch {
            // Already registered
        }
    });
    onUnmounted(() => {
        try {
            host.unregisterSkill(definition.name);
        } catch {
            // Already unregistered
        }
    });
}

export function usePageMcpSkills(): InstanceType<typeof Extensions.SkillsClient> {
    const client = usePageMcpClient();
    return Extensions.createSkillsClient(client);
}

/**
 * Register a Prompt on the Host.
 *
 * ```ts
 * useRegisterPrompt({
 *   name: 'generate-copy',
 *   title: 'Generate Marketing Copy',
 *   description: 'Generate marketing copy for current products',
 *   icon: '✍️',
 *   prompt: 'Please generate engaging marketing copy for the products on this page.',
 * });
 * ```
 */
export function useRegisterPrompt(definition: PageMcpPromptDefinition): void {
    const host = usePageMcpHost();
    onMounted(() => {
        try {
            host.registerPrompt(definition);
        } catch {
            // Already registered
        }
    });
    onUnmounted(() => {
        try {
            host.unregisterPrompt(definition.name);
        } catch {
            // Already unregistered
        }
    });
}

// ------ Re-exports ------

export {
    Extensions,
    PageMcpHost,
    PageMcpClient,
    EventBus,
} from '@page-mcp/core';

export type {
    SkillDefinition,
    SkillInfo,
    SkillGetResult,
    SkillExecutionResult,
    SkillExecutionContext,
    HostInfo,
} from '@page-mcp/core';
export type {
    PageMcpToolDefinition,
    PageMcpResourceDefinition,
    PageMcpPromptDefinition,
    AnthropicMcpTool,
    AnthropicMcpResource,
    AnthropicMcpPrompt,
} from '@page-mcp/protocol';
