// ============================================================
// @page-mcp/vue2 — Vue 2 Adapter for Page MCP SDK
// ============================================================

import {
    PageMcpHost,
    PageMcpClient,
    EventBus,
    type ToolDefinition,
    type ResourceDefinition,
    type SkillDefinition,
    type HostInfo,
} from '@page-mcp/core';

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
        pageMcpTools?: ToolDefinition[];
        pageMcpResources?: ResourceDefinition[];
        pageMcpSkills?: SkillDefinition[];
        parent?: Vue2Instance;
        [key: string]: unknown;
    };
    $root: Vue2Instance;
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
        const hostInfo: HostInfo = { name: options.name, version: options.version };

        host.start();
        client.connect();

        const injection: PageMcpInjection = { host, client, bus, hostInfo };

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

        // Register tools from component options
        const tools = this.$options.pageMcpTools;
        if (tools && Array.isArray(tools)) {
            for (const tool of tools) {
                try {
                    host.registerTool(tool);
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
                } catch {
                    // Already registered
                }
            }
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
    PageMcpHost,
    PageMcpClient,
    EventBus,
} from '@page-mcp/core';

export type {
    ToolDefinition,
    ToolInfo,
    ResourceDefinition,
    ResourceInfo,
    SkillDefinition,
    SkillInfo,
    SkillResult,
    HostInfo,
} from '@page-mcp/core';
