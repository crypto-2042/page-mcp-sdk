// ============================================================
// @page-mcp/chat — Lightweight Markdown Renderer
// ============================================================

/**
 * Minimal markdown-to-HTML converter.
 * Supports: bold, italic, inline code, code blocks, tables, links, headings, lists, line breaks.
 * No external dependencies.
 *
 * Architecture: We use a "placeholder" pattern to protect already-rendered
 * HTML from being mangled by subsequent transformations:
 *   1. Extract code blocks → placeholder
 *   2. Extract inline code → placeholder
 *   3. Detect & render tables → placeholder
 *   4. HTML-escape everything that remains (safe text only)
 *   5. Apply inline markdown rules (bold, italic, links, headings, lists)
 *   6. Convert newlines to <br>
 *   7. Restore all placeholders
 */

// Placeholder sentinel – unlikely to appear in user text
const PH = '\u0000PH';

export function renderMarkdown(text: string): string {
    if (!text) return '';

    // Protected HTML fragments stored here; referenced by index
    const slots: string[] = [];
    const ph = (html: string): string => {
        const idx = slots.length;
        slots.push(html);
        return `${PH}${idx}${PH}`;
    };

    // ---- Step 1: Extract fenced code blocks ----
    let src = text.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) => {
        return ph(`<pre class="mcp-code-block"><code class="lang-${escapeHtml(lang)}">${escapeHtml(code.trim())}</code></pre>`);
    });

    // ---- Step 2: Extract inline code ----
    src = src.replace(/`([^`]+)`/g, (_m, code) => {
        return ph(`<code class="mcp-inline-code">${escapeHtml(code)}</code>`);
    });

    // ---- Step 3: Detect and render tables ----
    const lines = src.split('\n');
    const outLines: string[] = [];
    let i = 0;

    while (i < lines.length) {
        // Table detection: row with |, next line is separator |---|
        if (
            isTableRow(lines[i]) &&
            i + 1 < lines.length &&
            isTableSeparator(lines[i + 1])
        ) {
            const headerLine = lines[i];
            i += 2; // skip header + separator
            const bodyLines: string[] = [];
            while (i < lines.length && isTableRow(lines[i])) {
                bodyLines.push(lines[i]);
                i++;
            }
            // Render the entire table and store as single placeholder
            outLines.push(ph(buildTableHtml(headerLine, bodyLines)));
            continue;
        }

        outLines.push(lines[i]);
        i++;
    }

    let html = outLines.join('\n');

    // ---- Step 4: HTML-escape only non-placeholder text ----
    html = escapeAroundPlaceholders(html, slots.length);

    // ---- Step 5: Inline markdown ----

    // Headings
    html = html.replace(/^### (.+)$/gm, '<h4 class="mcp-heading">$1</h4>');
    html = html.replace(/^## (.+)$/gm, '<h3 class="mcp-heading">$1</h3>');
    html = html.replace(/^# (.+)$/gm, '<h2 class="mcp-heading">$1</h2>');

    // Unordered lists (- item or * item)
    html = html.replace(/^[-*] (.+)$/gm, '<li class="mcp-list-item">$1</li>');
    html = html.replace(/((?:<li class="mcp-list-item">.*?<\/li>\s*)+)/g, '<ul class="mcp-list">$1</ul>');

    // Bold
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

    // ---- Step 6: Line breaks ----
    html = html.replace(/\n/g, '<br>');

    // Clean <br> around block elements
    html = html.replace(/<br>\s*(<(?:table|pre|ul|ol|h[2-6]|div))/gi, '$1');
    html = html.replace(/(<\/(?:table|pre|ul|ol|h[2-6]|div)>)\s*<br>/gi, '$1');

    // ---- Step 7: Restore all placeholders ----
    for (let j = 0; j < slots.length; j++) {
        html = html.replace(`${PH}${j}${PH}`, slots[j]);
    }

    return html;
}

// ================================================================
// Table helpers
// ================================================================

function isTableRow(line: string): boolean {
    if (!line) return false;
    const t = line.trim();
    return t.includes('|') && !isTableSeparator(line);
}

function isTableSeparator(line: string): boolean {
    if (!line) return false;
    const t = line.trim();
    // Match  |---|---| or ---|--- or |:--|:--:| etc.
    return /^\|?[\s\-:]+((\|[\s\-:]+)+)\|?\s*$/.test(t);
}

function buildTableHtml(headerLine: string, bodyLines: string[]): string {
    const parseCells = (line: string): string[] => {
        let t = line.trim();
        if (t.startsWith('|')) t = t.slice(1);
        if (t.endsWith('|')) t = t.slice(0, -1);
        return t.split('|').map(c => c.trim());
    };

    const headers = parseCells(headerLine);

    let out = '<table class="mcp-table"><thead><tr>';
    for (const h of headers) {
        out += `<th>${escapeHtml(h)}</th>`;
    }
    out += '</tr></thead>';

    if (bodyLines.length > 0) {
        out += '<tbody>';
        for (const row of bodyLines) {
            const cells = parseCells(row);
            out += '<tr>';
            for (let j = 0; j < headers.length; j++) {
                out += `<td>${escapeHtml(cells[j] ?? '')}</td>`;
            }
            out += '</tr>';
        }
        out += '</tbody>';
    }

    out += '</table>';
    return out;
}

// ================================================================
// Escaping
// ================================================================

/**
 * HTML-escape everything EXCEPT our placeholders.
 * Splits the string on placeholder boundaries, escapes the gaps.
 */
function escapeAroundPlaceholders(text: string, slotCount: number): string {
    if (slotCount === 0) return escapeHtml(text);

    // Build a regex that matches any placeholder token: \0PH<index>\0PH
    // We need to match the null-char sentinel
    const phPattern = new RegExp(`(${escapeRegExp(PH)}\\d+${escapeRegExp(PH)})`, 'g');
    const parts = text.split(phPattern);

    return parts
        .map(part => {
            // If this part is a placeholder, keep it as-is
            if (part.startsWith(PH) && part.endsWith(PH)) {
                return part;
            }
            return escapeHtml(part);
        })
        .join('');
}

function escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
