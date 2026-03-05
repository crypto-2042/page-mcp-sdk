// ============================================================
// @page-mcp/chat — CSS Styles (iOS 26 Glassmorphism)
// ============================================================

import type { ChatTheme } from './types.js';

/**
 * Generate complete CSS for the chat widget.
 * All styles are scoped within Shadow DOM — no global leaks.
 */
export function generateStyles(theme: ChatTheme, accentColor: string): string {
    const isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const vars = isDark ? `
        --mcp-bg-primary: rgba(15, 10, 30, 0.85);
        --mcp-bg-secondary: rgba(30, 20, 60, 0.6);
        --mcp-bg-glass: rgba(40, 30, 80, 0.35);
        --mcp-bg-glass-hover: rgba(50, 40, 90, 0.45);
        --mcp-bg-input: rgba(35, 25, 65, 0.5);
        --mcp-bg-user-bubble: ${accentColor};
        --mcp-bg-ai-bubble: rgba(45, 35, 85, 0.4);
        --mcp-bg-tool-card: rgba(50, 40, 90, 0.3);
        --mcp-border: rgba(120, 100, 200, 0.2);
        --mcp-border-light: rgba(120, 100, 200, 0.1);
        --mcp-text-primary: rgba(255, 255, 255, 0.95);
        --mcp-text-secondary: rgba(255, 255, 255, 0.6);
        --mcp-text-muted: rgba(255, 255, 255, 0.4);
        --mcp-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        --mcp-shadow-fab: 0 4px 24px rgba(0, 0, 0, 0.5), 0 0 40px ${accentColor}33;
        --mcp-glow: 0 0 20px ${accentColor}22;
    ` : `
        --mcp-bg-primary: rgba(255, 255, 255, 0.85);
        --mcp-bg-secondary: rgba(245, 243, 250, 0.7);
        --mcp-bg-glass: rgba(255, 255, 255, 0.45);
        --mcp-bg-glass-hover: rgba(255, 255, 255, 0.55);
        --mcp-bg-input: rgba(245, 243, 250, 0.6);
        --mcp-bg-user-bubble: ${accentColor};
        --mcp-bg-ai-bubble: rgba(245, 243, 250, 0.5);
        --mcp-bg-tool-card: rgba(245, 243, 250, 0.4);
        --mcp-border: rgba(100, 80, 180, 0.15);
        --mcp-border-light: rgba(100, 80, 180, 0.08);
        --mcp-text-primary: rgba(20, 15, 40, 0.9);
        --mcp-text-secondary: rgba(20, 15, 40, 0.55);
        --mcp-text-muted: rgba(20, 15, 40, 0.35);
        --mcp-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        --mcp-shadow-fab: 0 4px 24px rgba(0, 0, 0, 0.15), 0 0 30px ${accentColor}22;
        --mcp-glow: 0 0 15px ${accentColor}18;
    `;

    return `
        :host {
            --mcp-accent: ${accentColor};
            --mcp-accent-hover: ${accentColor}dd;
            --mcp-radius-sm: 12px;
            --mcp-radius-md: 18px;
            --mcp-radius-lg: 24px;
            --mcp-radius-full: 50%;
            --mcp-blur: 24px;
            --mcp-blur-heavy: 40px;
            --mcp-transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            --mcp-font: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            ${vars}

            all: initial;
            font-family: var(--mcp-font);
            font-size: 14px;
            color: var(--mcp-text-primary);
            line-height: 1.5;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        /* ====== FAB Button ====== */
        .mcp-fab {
            position: fixed;
            z-index: 999998;
            width: 56px;
            height: 56px;
            border-radius: var(--mcp-radius-full);
            border: 1px solid var(--mcp-border);
            background: var(--mcp-bg-glass);
            backdrop-filter: blur(var(--mcp-blur));
            -webkit-backdrop-filter: blur(var(--mcp-blur));
            box-shadow: var(--mcp-shadow-fab);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all var(--mcp-transition);
            animation: mcp-fab-appear 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .mcp-fab:hover {
            transform: scale(1.08);
            background: var(--mcp-bg-glass-hover);
            box-shadow: var(--mcp-shadow-fab), var(--mcp-glow);
        }

        .mcp-fab:active {
            transform: scale(0.95);
        }

        .mcp-fab.bottom-right { bottom: 24px; right: 24px; }
        .mcp-fab.bottom-left { bottom: 24px; left: 24px; }
        .mcp-fab.top-right { top: 24px; right: 24px; }
        .mcp-fab.top-left { top: 24px; left: 24px; }

        .mcp-fab-icon {
            width: 26px;
            height: 26px;
            fill: var(--mcp-text-primary);
            transition: transform var(--mcp-transition);
        }

        .mcp-fab:hover .mcp-fab-icon {
            transform: rotate(15deg);
        }

        .mcp-fab.open .mcp-fab-icon {
            transform: rotate(45deg);
        }

        @keyframes mcp-fab-appear {
            from { opacity: 0; transform: scale(0.3) rotate(-180deg); }
            to { opacity: 1; transform: scale(1) rotate(0deg); }
        }

        /* ====== Chat Panel ====== */
        .mcp-panel {
            position: fixed;
            z-index: 999999;
            display: flex;
            flex-direction: column;
            background: var(--mcp-bg-primary);
            backdrop-filter: blur(var(--mcp-blur-heavy));
            -webkit-backdrop-filter: blur(var(--mcp-blur-heavy));
            border: 1px solid var(--mcp-border);
            border-radius: var(--mcp-radius-lg);
            box-shadow: var(--mcp-shadow);
            overflow: hidden;
            opacity: 0;
            transform: translateY(20px) scale(0.95);
            pointer-events: none;
            transition: all var(--mcp-transition);
        }

        .mcp-panel.open {
            opacity: 1;
            transform: translateY(0) scale(1);
            pointer-events: auto;
        }

        .mcp-panel.bottom-right { bottom: 90px; right: 24px; }
        .mcp-panel.bottom-left { bottom: 90px; left: 24px; }
        .mcp-panel.top-right { top: 90px; right: 24px; }
        .mcp-panel.top-left { top: 90px; left: 24px; }

        /* ====== Header ====== */
        .mcp-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 20px;
            background: var(--mcp-bg-secondary);
            backdrop-filter: blur(var(--mcp-blur));
            -webkit-backdrop-filter: blur(var(--mcp-blur));
            border-bottom: 1px solid var(--mcp-border-light);
        }

        .mcp-header-left {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .mcp-header-dot {
            width: 10px;
            height: 10px;
            border-radius: var(--mcp-radius-full);
            background: #34d399;
            box-shadow: 0 0 8px #34d39966;
            animation: mcp-pulse 2s infinite;
        }

        @keyframes mcp-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        .mcp-header-title {
            font-size: 15px;
            font-weight: 600;
            letter-spacing: -0.01em;
        }

        .mcp-close-btn {
            width: 32px;
            height: 32px;
            border-radius: var(--mcp-radius-sm);
            border: none;
            background: var(--mcp-bg-glass);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            color: var(--mcp-text-secondary);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all var(--mcp-transition);
            font-size: 16px;
        }

        .mcp-close-btn:hover {
            background: var(--mcp-bg-glass-hover);
            color: var(--mcp-text-primary);
        }

        .mcp-header-actions {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .mcp-clear-btn {
            width: 32px;
            height: 32px;
            border-radius: var(--mcp-radius-sm);
            border: none;
            background: var(--mcp-bg-glass);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            color: var(--mcp-text-secondary);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all var(--mcp-transition);
            font-size: 16px;
        }

        .mcp-clear-btn:hover {
            background: var(--mcp-bg-glass-hover);
            color: var(--mcp-text-primary);
        }

        .mcp-clear-icon {
            width: 16px;
            height: 16px;
            fill: currentColor;
        }

        /* ====== Messages ====== */
        .mcp-messages {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            scroll-behavior: smooth;
        }

        .mcp-messages::-webkit-scrollbar {
            width: 4px;
        }

        .mcp-messages::-webkit-scrollbar-track {
            background: transparent;
        }

        .mcp-messages::-webkit-scrollbar-thumb {
            background: var(--mcp-border);
            border-radius: 4px;
        }

        .mcp-msg {
            max-width: 85%;
            animation: mcp-msg-appear 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes mcp-msg-appear {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .mcp-msg-user {
            align-self: flex-end;
        }

        .mcp-msg-assistant {
            align-self: flex-start;
        }

        .mcp-msg-label {
            font-size: 11px;
            color: var(--mcp-text-muted);
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .mcp-msg-user .mcp-msg-label {
            text-align: right;
        }

        .mcp-bubble {
            padding: 12px 16px;
            border-radius: var(--mcp-radius-md);
            word-break: break-word;
            line-height: 1.55;
        }

        .mcp-msg-user .mcp-bubble {
            background: var(--mcp-bg-user-bubble);
            color: #ffffff;
            border-bottom-right-radius: 6px;
        }

        .mcp-msg-assistant .mcp-bubble {
            background: var(--mcp-bg-ai-bubble);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid var(--mcp-border-light);
            border-bottom-left-radius: 6px;
        }

        .mcp-bubble a {
            color: var(--mcp-accent);
            text-decoration: none;
        }

        .mcp-bubble a:hover {
            text-decoration: underline;
        }

        .mcp-bubble strong {
            font-weight: 600;
        }

        .mcp-inline-code {
            background: rgba(0,0,0,0.2);
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'SF Mono', 'Fira Code', monospace;
            font-size: 13px;
        }

        .mcp-code-block {
            background: rgba(0,0,0,0.3);
            padding: 12px;
            border-radius: var(--mcp-radius-sm);
            overflow-x: auto;
            margin: 8px 0;
            font-family: 'SF Mono', 'Fira Code', monospace;
            font-size: 13px;
            line-height: 1.4;
        }

        .mcp-code-block code {
            color: var(--mcp-text-primary);
        }

        /* ====== Markdown Tables ====== */
        .mcp-table {
            width: 100%;
            border-collapse: collapse;
            margin: 8px 0;
            font-size: 13px;
            border-radius: var(--mcp-radius-sm);
            overflow: hidden;
            border: 1px solid var(--mcp-border);
        }

        .mcp-table th,
        .mcp-table td {
            padding: 8px 12px;
            text-align: left;
            border-bottom: 1px solid var(--mcp-border-light);
        }

        .mcp-table th {
            background: var(--mcp-bg-glass);
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.03em;
            color: var(--mcp-text-secondary);
        }

        .mcp-table tbody tr:nth-child(even) {
            background: var(--mcp-bg-glass);
        }

        .mcp-table tbody tr:hover {
            background: var(--mcp-bg-glass-hover);
        }

        .mcp-table td {
            color: var(--mcp-text-primary);
        }

        /* ====== Headings ====== */
        .mcp-heading {
            margin: 8px 0 4px;
            font-weight: 600;
            color: var(--mcp-text-primary);
        }

        h2.mcp-heading { font-size: 17px; }
        h3.mcp-heading { font-size: 15px; }
        h4.mcp-heading { font-size: 14px; }

        /* ====== Lists ====== */
        .mcp-list {
            margin: 6px 0;
            padding-left: 20px;
        }

        .mcp-list-item {
            margin: 2px 0;
            color: var(--mcp-text-primary);
        }

        /* ====== Tool Call Card ====== */
        .mcp-tool-card {
            margin: 8px 0;
            padding: 12px 14px;
            background: var(--mcp-bg-tool-card);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid var(--mcp-border);
            border-radius: var(--mcp-radius-md);
            animation: mcp-msg-appear 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .mcp-tool-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 6px;
        }

        .mcp-tool-icon {
            width: 16px;
            height: 16px;
            fill: var(--mcp-accent);
        }

        .mcp-tool-name {
            font-size: 13px;
            font-weight: 600;
            color: var(--mcp-accent);
            font-family: 'SF Mono', 'Fira Code', monospace;
        }

        .mcp-tool-status {
            font-size: 11px;
            padding: 2px 8px;
            border-radius: 99px;
            margin-left: auto;
        }

        .mcp-tool-status.calling {
            background: rgba(250, 204, 21, 0.15);
            color: #facc15;
        }

        .mcp-tool-status.success {
            background: rgba(52, 211, 153, 0.15);
            color: #34d399;
        }

        .mcp-tool-status.error {
            background: rgba(239, 68, 68, 0.15);
            color: #ef4444;
        }

        .mcp-tool-result {
            font-size: 12px;
            color: var(--mcp-text-secondary);
            margin-top: 6px;
            padding: 8px;
            background: rgba(0,0,0,0.15);
            border-radius: var(--mcp-radius-sm);
            font-family: 'SF Mono', 'Fira Code', monospace;
            max-height: 100px;
            overflow-y: auto;
            white-space: pre-wrap;
            word-break: break-all;
        }

        /* ====== Loading Indicator ====== */
        .mcp-loading {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 12px 16px;
            align-self: flex-start;
        }

        .mcp-loading-dot {
            width: 7px;
            height: 7px;
            border-radius: var(--mcp-radius-full);
            background: var(--mcp-text-muted);
            animation: mcp-bounce 1.4s infinite;
        }

        .mcp-loading-dot:nth-child(2) { animation-delay: 0.16s; }
        .mcp-loading-dot:nth-child(3) { animation-delay: 0.32s; }

        @keyframes mcp-bounce {
            0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
            40% { transform: translateY(-8px); opacity: 1; }
        }

        /* ====== Input Area ====== */
        .mcp-input-area {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 14px 16px;
            background: var(--mcp-bg-secondary);
            backdrop-filter: blur(var(--mcp-blur));
            -webkit-backdrop-filter: blur(var(--mcp-blur));
            border-top: 1px solid var(--mcp-border-light);
        }

        .mcp-input {
            flex: 1;
            padding: 10px 16px;
            border-radius: 999px;
            border: 1px solid var(--mcp-border);
            background: var(--mcp-bg-input);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            color: var(--mcp-text-primary);
            font-family: var(--mcp-font);
            font-size: 14px;
            outline: none;
            transition: all var(--mcp-transition);
        }

        .mcp-input::placeholder {
            color: var(--mcp-text-muted);
        }

        .mcp-input:focus {
            border-color: var(--mcp-accent);
            box-shadow: 0 0 0 3px ${accentColor}22;
        }

        .mcp-send-btn {
            width: 38px;
            height: 38px;
            border-radius: var(--mcp-radius-full);
            border: none;
            background: var(--mcp-accent);
            color: #ffffff;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all var(--mcp-transition);
            flex-shrink: 0;
        }

        .mcp-send-btn:hover {
            background: var(--mcp-accent-hover);
            transform: scale(1.05);
        }

        .mcp-send-btn:active {
            transform: scale(0.92);
        }

        .mcp-send-btn:disabled {
            opacity: 0.4;
            cursor: not-allowed;
            transform: none;
        }

        .mcp-send-icon {
            width: 18px;
            height: 18px;
            fill: currentColor;
        }

        /* ====== Mobile Responsive ====== */
        @media (max-width: 768px) {
            .mcp-panel {
                inset: 0 !important;
                width: 100% !important;
                height: 100% !important;
                border-radius: 0;
                transform: translateY(100%);
            }

            .mcp-panel.open {
                transform: translateY(0);
            }

            .mcp-header {
                padding-top: 12px;
            }

            .mcp-mobile-handle {
                display: block;
                width: 40px;
                height: 4px;
                border-radius: 2px;
                background: var(--mcp-text-muted);
                margin: 0 auto 8px;
            }

            .mcp-fab {
                bottom: 16px !important;
                right: 16px !important;
                left: auto !important;
                top: auto !important;
            }
        }

        @media (min-width: 769px) {
            .mcp-mobile-handle {
                display: none;
            }
        }

        /* ====== Welcome Message ====== */
        .mcp-welcome {
            text-align: center;
            padding: 20px;
            color: var(--mcp-text-secondary);
        }

        .mcp-welcome-icon {
            width: 48px;
            height: 48px;
            margin: 0 auto 12px;
            opacity: 0.6;
            fill: var(--mcp-accent);
        }

        /* ====== Prompt Shortcut Cards ====== */
        .mcp-prompts {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            padding: 0 16px 12px;
            animation: mcp-msg-appear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .mcp-prompts.hidden {
            display: none;
        }

        .mcp-prompt-card {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 14px;
            border-radius: 999px;
            border: 1px solid var(--mcp-border);
            background: var(--mcp-bg-glass);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            cursor: pointer;
            transition: all var(--mcp-transition);
            font-family: var(--mcp-font);
            font-size: 13px;
            font-weight: 500;
            color: var(--mcp-text-primary);
            white-space: nowrap;
        }

        .mcp-prompt-card:hover {
            background: var(--mcp-bg-glass-hover);
            border-color: var(--mcp-accent);
            box-shadow: 0 0 12px var(--mcp-accent)22;
            transform: translateY(-1px);
        }

        .mcp-prompt-card:active {
            transform: scale(0.96);
        }

        .mcp-prompt-icon {
            font-size: 15px;
            line-height: 1;
        }
    `;
}
