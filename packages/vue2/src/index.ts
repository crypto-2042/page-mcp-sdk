// ============================================================
// @page-mcp/vue2 — Vue 2 Adapter for Page MCP SDK
// ============================================================

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

// ------ Types for Vue 2 ------

interface Vue2ComponentOptions {
    beforeCreate?: () => void;
    created?: () => void;
    beforeDestroy?: () => void;
    [key: string]: unknown;
}

interface Vue2Instance {
    $pageMcp?: PageMcpInjection;
    $options: {
        pageMcpTools?: PageMcpToolDefinition[];
        pageMcpResources?: PageMcpResourceDefinition[];
        pageMcpSkills?: SkillDefinition[];
        pageMcpPrompts?: PageMcpPromptDefinition[];
        parent?: Vue2Instance;
        [key: string]: unknown;
    };
    $root: Vue2Instance;
    __pageMcpRegistered?: {
        tools: string[];
        resources: string[];
        skills: string[];
        prompts: string[];
    };
    [key: string]: unknown;
}

interface Vue2Constructor {
    mixin(mixin: Vue2ComponentOptions): void;
    prototype: Vue2Instance;
    [key: string]: unknown;
}

interface PageMcpInjection {
    host: PageMcpHost;
    client: PageMcpClient;
    skills: InstanceType<typeof Extensions.SkillsClient>;
    bus: EventBus;
    hostInfo: HostInfo;
}

// ------ Plugin ------

export interface PageMcpPluginOptions {
    name: string;
    version: string;
    bus?: EventBus;
}

/**
 * Vue 2 Plugin. Install globally:
 *
 * ```js
 * import Vue from 'vue';
 * import { PageMcpPlugin } from '@page-mcp/vue2';
 *
 * Vue.use(PageMcpPlugin, { name: 'my-app', version: '1.0' });
 * ```
 *
 * After installation, `this.$pageMcp` is available in all components:
 * - `this.$pageMcp.host` — PageMcpHost instance
 * - `this.$pageMcp.client` — PageMcpClient instance
 * - `this.$pageMcp.bus` — EventBus instance
 */
export const PageMcpPlugin = {
    install(Vue: Vue2Constructor, options: PageMcpPluginOptions): void {
        const bus = options.bus ?? new EventBus();
        const host = new PageMcpHost({ name: options.name, version: options.version, bus });
        const client = new PageMcpClient({ bus });
        const skills = Extensions.createSkillsClient(client);
        const hostInfo: HostInfo = { name: options.name, version: options.version };

        host.start();
        client.connect();

        const injection: PageMcpInjection = { host, client, skills, bus, hostInfo };

        // Make $pageMcp available in all components
        Vue.prototype.$pageMcp = injection;

        // Install the auto-registration mixin
        Vue.mixin(pageMcpAutoRegisterMixin);
    },
};

// ------ Mixin ------

/**
 * Mixin that auto-registers tools/resources/skills defined in component options.
 *
 * ```js
 * export default {
 *   pageMcpTools: [
 *     {
 *       name: 'search',
 *       description: 'Search products',
 *       parameters: { type: 'object', properties: { q: { type: 'string' } } },
 *       handler: async (args) => this.searchProducts(args.q),
 *     }
 *   ],
 *   pageMcpResources: [...],
 *   pageMcpSkills: [...],
 * }
 * ```
 */
const pageMcpAutoRegisterMixin: Vue2ComponentOptions = {
    created(this: Vue2Instance) {
        const pageMcp = this.$pageMcp;
        if (!pageMcp) return;

        const { host } = pageMcp;
        this.__pageMcpRegistered = {
            tools: [],
            resources: [],
            skills: [],
            prompts: [],
        };

        // Register tools from component options
        const tools = this.$options.pageMcpTools;
        if (tools && Array.isArray(tools)) {
            for (const tool of tools) {
                try {
                    host.registerTool(tool);
                    this.__pageMcpRegistered.tools.push(tool.name);
                } catch {
                    // Already registered
                }
            }
        }

        // Register resources from component options
        const resources = this.$options.pageMcpResources;
        if (resources && Array.isArray(resources)) {
            for (const resource of resources) {
                try {
                    host.registerResource(resource);
                    this.__pageMcpRegistered.resources.push(resource.uri);
                } catch {
                    // Already registered
                }
            }
        }

        // Register skills from component options
        const skills = this.$options.pageMcpSkills;
        if (skills && Array.isArray(skills)) {
            for (const skill of skills) {
                try {
                    host.registerSkill(skill);
                    this.__pageMcpRegistered.skills.push(skill.name);
                } catch {
                    // Already registered
                }
            }
        }

        // Register prompts from component options
        const prompts = this.$options.pageMcpPrompts;
        if (prompts && Array.isArray(prompts)) {
            for (const prompt of prompts) {
                try {
                    host.registerPrompt(prompt);
                    this.__pageMcpRegistered.prompts.push(prompt.name);
                } catch {
                    // Already registered
                }
            }
        }
    },
    beforeDestroy(this: Vue2Instance) {
        const pageMcp = this.$pageMcp;
        const registered = this.__pageMcpRegistered;
        if (!pageMcp || !registered) return;
        const { host } = pageMcp;

        for (const name of registered.tools) {
            try { host.unregisterTool(name); } catch { /* noop */ }
        }
        for (const uri of registered.resources) {
            try { host.unregisterResource(uri); } catch { /* noop */ }
        }
        for (const name of registered.skills) {
            try { host.unregisterSkill(name); } catch { /* noop */ }
        }
        for (const name of registered.prompts) {
            try { host.unregisterPrompt(name); } catch { /* noop */ }
        }
    },
};

/**
 * Standalone mixin for manual use (without the plugin).
 * Useful when you want to use the mixin pattern explicitly.
 */
export { pageMcpAutoRegisterMixin as pageMcpMixin };

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
