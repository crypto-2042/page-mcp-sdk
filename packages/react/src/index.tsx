// ============================================================
// @page-mcp/react — React Adapter for Page MCP SDK
// ============================================================

import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useMemo,
    useState,
    type ReactNode,
} from 'react';

import {
    PageMcpHost,
    PageMcpClient,
    EventBus,
    type ToolDefinition,
    type ResourceDefinition,
    type SkillDefinition,
    type HostInfo,
} from '@page-mcp/core';

// ------ Context ------

interface PageMcpContextValue {
    host: PageMcpHost;
    client: PageMcpClient;
    bus: EventBus;
    hostInfo: HostInfo;
}

const PageMcpContext = createContext<PageMcpContextValue | null>(null);

// ------ Provider ------

export interface PageMcpProviderProps {
    /** Application name exposed to AI */
    name: string;
    /** Application version */
    version: string;
    /** Optional pre-configured EventBus */
    bus?: EventBus;
    children: ReactNode;
}

/**
 * Provider component that creates and manages PageMcpHost + PageMcpClient.
 * Wrap your app or a section of your component tree with this.
 *
 * ```tsx
 * <PageMcpProvider name="my-app" version="1.0">
 *   <App />
 * </PageMcpProvider>
 * ```
 */
export function PageMcpProvider({ name, version, bus: externalBus, children }: PageMcpProviderProps) {
    const contextValue = useMemo(() => {
        const bus = externalBus ?? new EventBus();
        const host = new PageMcpHost({ name, version, bus });
        const client = new PageMcpClient({ bus });
        const hostInfo: HostInfo = { name, version };

        host.start();

        return { host, client, bus, hostInfo };
    }, [name, version, externalBus]);

    // Auto-connect client
    const [connected, setConnected] = useState(false);
    useEffect(() => {
        contextValue.client.connect().then(() => setConnected(true));
        return () => {
            contextValue.host.destroy();
            contextValue.client.disconnect();
        };
    }, [contextValue]);

    return (
        <PageMcpContext.Provider value={contextValue}>
            {children}
        </PageMcpContext.Provider>
    );
}

// ------ Hooks ------

function usePageMcpContext(): PageMcpContextValue {
    const ctx = useContext(PageMcpContext);
    if (!ctx) {
        throw new Error('usePageMcp* hooks must be used within a <PageMcpProvider>');
    }
    return ctx;
}

/**
 * Get the PageMcpHost instance.
 */
export function usePageMcpHost(): PageMcpHost {
    return usePageMcpContext().host;
}

/**
 * Get the PageMcpClient instance.
 */
export function usePageMcpClient(): PageMcpClient {
    return usePageMcpContext().client;
}

/**
 * Get the EventBus instance.
 */
export function usePageMcpBus(): EventBus {
    return usePageMcpContext().bus;
}

/**
 * Register a Tool on the Host. Automatically deregisters on unmount.
 *
 * ```tsx
 * useRegisterTool({
 *   name: 'search',
 *   description: 'Search products',
 *   inputSchema: { type: 'object', properties: { q: { type: 'string' } } },
 *   execute: async (input) => searchProducts(input.q as string),
 * });
 * ```
 */
export function useRegisterTool(definition: ToolDefinition): void {
    const host = usePageMcpHost();
    const defRef = useRef(definition);
    defRef.current = definition;

    useEffect(() => {
        try {
            host.registerTool(defRef.current);
        } catch {
            // Already registered (e.g., strict mode double-mount)
        }
    }, [host, defRef.current.name]);
}

/**
 * Register a Resource on the Host. Automatically deregisters on unmount.
 */
export function useRegisterResource(definition: ResourceDefinition): void {
    const host = usePageMcpHost();
    const defRef = useRef(definition);
    defRef.current = definition;

    useEffect(() => {
        try {
            host.registerResource(defRef.current);
        } catch {
            // Already registered
        }
    }, [host, defRef.current.uri]);
}

/**
 * Register a Skill on the Host. Automatically deregisters on unmount.
 */
export function useRegisterSkill(definition: SkillDefinition): void {
    const host = usePageMcpHost();
    const defRef = useRef(definition);
    defRef.current = definition;

    useEffect(() => {
        try {
            host.registerSkill(defRef.current);
        } catch {
            // Already registered
        }
    }, [host, defRef.current.name]);
}

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
