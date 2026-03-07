// ============================================================
// @page-mcp/chat — Markdown Renderer (marked + DOMPurify)
// ============================================================

import { marked } from 'marked';
import DOMPurify from 'dompurify';

const SAFE_URI = /^(?:(?:https?|mailto|tel):|\/|\.\/|\.\.\/|#)/i;

export function renderMarkdown(text: string): string {
    if (!text) return '';

    // Fallback for non-browser environments.
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return escapeHtml(text).replace(/\n/g, '<br>');
    }

    const rawHtml = marked.parse(text, {
        gfm: true,
        breaks: true,
    }) as string;

    const sanitized = DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: [
            'a',
            'p',
            'br',
            'strong',
            'em',
            'code',
            'pre',
            'blockquote',
            'ul',
            'ol',
            'li',
            'h1',
            'h2',
            'h3',
            'h4',
            'h5',
            'h6',
            'table',
            'thead',
            'tbody',
            'tr',
            'th',
            'td',
        ],
        ALLOWED_ATTR: ['href', 'class', 'target', 'rel'],
        ALLOWED_URI_REGEXP: SAFE_URI,
    });

    return decorateHtml(String(sanitized));
}

function decorateHtml(html: string): string {
    const template = document.createElement('template');
    template.innerHTML = html;

    // Headings
    template.content.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach((el) => {
        el.classList.add('mcp-heading');
    });

    // Lists
    template.content.querySelectorAll('ul,ol').forEach((el) => {
        el.classList.add('mcp-list');
    });
    template.content.querySelectorAll('li').forEach((el) => {
        el.classList.add('mcp-list-item');
    });

    // Tables
    template.content.querySelectorAll('table').forEach((el) => {
        el.classList.add('mcp-table');
    });

    // Code blocks + inline code
    template.content.querySelectorAll('pre').forEach((pre) => {
        pre.classList.add('mcp-code-block');
        const code = pre.querySelector('code');
        if (!code) return;

        const langClass = Array.from(code.classList).find((cls) => cls.startsWith('language-'));
        if (langClass) {
            code.classList.remove(langClass);
            code.classList.add(`lang-${langClass.slice('language-'.length)}`);
        }
    });

    template.content.querySelectorAll('code').forEach((code) => {
        if (code.parentElement?.tagName.toLowerCase() === 'pre') return;
        code.classList.add('mcp-inline-code');
    });

    // Links
    template.content.querySelectorAll('a').forEach((a) => {
        const href = (a.getAttribute('href') || '').trim();
        if (!SAFE_URI.test(href)) {
            a.setAttribute('href', '#');
        }
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer nofollow');
    });

    return template.innerHTML;
}

function escapeHtml(text: string): string {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (char) => map[char] || char);
}

