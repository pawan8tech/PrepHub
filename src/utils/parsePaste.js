import { createBlock } from './editorBlockModel';

// GitHub-style admonition labels → our callout variants.
const CALLOUT_TAGS = {
  note: 'info',
  info: 'info',
  important: 'important',
  warning: 'warning',
  caution: 'warning',
  danger: 'warning',
  tip: 'tip',
  hint: 'tip',
};

const isTableSeparator = (line) =>
  typeof line === 'string' && /\|/.test(line) && /-/.test(line) && /^[\s|:-]+$/.test(line.trim());

const isListItem = (line) => /^\s*([-*+]|\d+[.)])\s+/.test(line);
const isHeading = (line) => /^(#{1,6})\s+/.test(line);
const isQuote = (line) => /^\s*>\s?/.test(line);

/** Strip inline markdown the editor can't render (bold/italic/code/links). */
function stripInline(s) {
  return String(s ?? '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .trim();
}

function splitTableRow(line) {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);
  return s.split('|').map((c) => c.trim());
}

function parseMarkdownTable(tableLines) {
  if (tableLines.length < 2) return null;
  const headers = splitTableRow(tableLines[0]);
  if (!headers.length) return null;
  const rows = [];
  for (let r = 2; r < tableLines.length; r += 1) {
    const cells = splitTableRow(tableLines[r]);
    while (cells.length < headers.length) cells.push('');
    rows.push({ cells: cells.slice(0, headers.length) });
  }
  return { headers, rows };
}

/**
 * Parse pasted text into editor blocks by detecting common structures:
 * headings (#), fenced code (```), markdown tables, blockquotes/admonitions
 * (callouts), and bullet/numbered lists. Everything else is split Notion-style —
 * each non-blank line becomes its own paragraph block. Returns [] for empty input.
 */
export function parsePastedBlocks(raw) {
  const text = String(raw ?? '').replace(/\r\n?/g, '\n');
  if (!text.trim()) return [];

  const lines = text.split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === '') {
      i += 1;
      continue;
    }

    // Fenced code block
    const fence = line.match(/^```(\w+)?\s*$/);
    if (fence) {
      const language = fence[1] || 'text';
      const codeLines = [];
      i += 1;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        codeLines.push(lines[i]);
        i += 1;
      }
      i += 1; // skip closing fence
      blocks.push(createBlock('code', { content: codeLines.join('\n'), language }));
      continue;
    }

    // Heading
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      blocks.push(createBlock('heading', { level: h[1].length, content: stripInline(h[2].trim()) }));
      i += 1;
      continue;
    }

    // Markdown table (header row followed by a |---|---| separator)
    if (line.includes('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const tableLines = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim() !== '') {
        tableLines.push(lines[i]);
        i += 1;
      }
      const table = parseMarkdownTable(tableLines);
      if (table) {
        blocks.push(createBlock('table', table));
        continue;
      }
    }

    // Blockquote → callout (with optional [!WARNING] / [!TIP] admonition)
    if (isQuote(line)) {
      const quoteLines = [];
      while (i < lines.length && isQuote(lines[i])) {
        quoteLines.push(lines[i].replace(/^\s*>\s?/, ''));
        i += 1;
      }
      let variant = 'info';
      let body = quoteLines;
      const adm = quoteLines[0] && quoteLines[0].match(/^\[!(\w+)\]\s*(.*)$/);
      if (adm) {
        variant = CALLOUT_TAGS[adm[1].toLowerCase()] || 'info';
        const firstRest = adm[2];
        body = firstRest ? [firstRest, ...quoteLines.slice(1)] : quoteLines.slice(1);
      }
      blocks.push(createBlock('callout', { variant, content: stripInline(body.join('\n').trim()) }));
      continue;
    }

    // List (bullet or numbered) — group consecutive items
    if (isListItem(line)) {
      const items = [];
      while (i < lines.length && isListItem(lines[i])) {
        items.push(stripInline(lines[i].replace(/^\s*([-*+]|\d+[.)])\s+/, '').trim()));
        i += 1;
      }
      blocks.push(createBlock('list', { items: items.length ? items : [''] }));
      continue;
    }

    // Notion-style: any other non-blank line becomes its own paragraph block.
    blocks.push(createBlock('text', { content: stripInline(line.trim()) }));
    i += 1;
  }

  return blocks;
}

// ── Rich (text/html) paste — used when copying from Notion, docs, web pages ──

const HTML_BLOCK_TAGS = new Set([
  'p', 'div', 'section', 'article', 'ul', 'ol', 'table', 'pre',
  'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'figure', 'img', 'hr',
]);

/** textContent, but keep <br> as line breaks and normalize non-breaking spaces. */
function textOf(el) {
  if (!el) return '';
  const clone = el.cloneNode(true);
  clone.querySelectorAll?.('br').forEach((br) => br.replaceWith('\n'));
  return (clone.textContent || '').replace(/ /g, ' ').replace(/[ \t]+\n/g, '\n').trim();
}

function langFromClass(el) {
  const cls = (el && el.getAttribute && el.getAttribute('class')) || '';
  const m = cls.match(/language-([\w+#-]+)/i);
  return m ? m[1].toLowerCase() : 'text';
}

function hasBlockChildren(el) {
  return Array.from(el.children || []).some((c) => HTML_BLOCK_TAGS.has(c.tagName.toLowerCase()));
}

function tableToBlock(table) {
  const trs = Array.from(table.querySelectorAll('tr'));
  if (!trs.length) return null;
  const grid = trs.map((tr) => Array.from(tr.querySelectorAll('th,td')).map((c) => textOf(c)));
  const headers = grid[0];
  if (!headers.length) return null;
  const rows = grid.slice(1).map((cells) => {
    const c = [...cells];
    while (c.length < headers.length) c.push('');
    return { cells: c.slice(0, headers.length) };
  });
  return { headers, rows };
}

function elementToBlocks(el, out) {
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === 3) {
      const t = (node.textContent || '').replace(/ /g, ' ').trim();
      if (t) out.push(createBlock('text', { content: t }));
      continue;
    }
    if (node.nodeType !== 1) continue;

    const tag = node.tagName.toLowerCase();
    switch (tag) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6': {
        const content = textOf(node);
        if (content) out.push(createBlock('heading', { level: Number(tag[1]), content }));
        break;
      }
      case 'ul':
      case 'ol': {
        const items = Array.from(node.querySelectorAll(':scope > li'))
          .map((li) => textOf(li))
          .filter(Boolean);
        if (items.length) out.push(createBlock('list', { items }));
        break;
      }
      case 'pre': {
        const codeEl = node.querySelector('code');
        const content = (codeEl || node).textContent.replace(/\n$/, '');
        if (content.trim()) out.push(createBlock('code', { content, language: langFromClass(codeEl || node) }));
        break;
      }
      case 'blockquote': {
        const content = textOf(node);
        if (content) out.push(createBlock('callout', { variant: 'info', content }));
        break;
      }
      case 'table': {
        const tbl = tableToBlock(node);
        if (tbl) out.push(createBlock('table', tbl));
        break;
      }
      case 'img': {
        const src = node.getAttribute('src');
        if (src) out.push(createBlock('image', { url: src, caption: node.getAttribute('alt') || '' }));
        break;
      }
      case 'figure': {
        const img = node.querySelector('img');
        const src = img && img.getAttribute('src');
        if (src) {
          const cap = node.querySelector('figcaption');
          out.push(createBlock('image', { url: src, caption: cap ? textOf(cap) : img.getAttribute('alt') || '' }));
        } else {
          elementToBlocks(node, out);
        }
        break;
      }
      case 'br':
      case 'hr':
        break;
      case 'p': {
        const content = textOf(node);
        if (content) out.push(createBlock('text', { content }));
        break;
      }
      default: {
        // Wrapper element (div/section/…) — recurse if it holds block children,
        // otherwise treat its text as a paragraph.
        if (hasBlockChildren(node)) {
          elementToBlocks(node, out);
        } else {
          const content = textOf(node);
          if (content) out.push(createBlock('text', { content }));
        }
      }
    }
  }
}

/**
 * Parse an HTML clipboard payload (e.g. from Notion, Google Docs, a web page)
 * into editor blocks. Returns [] when nothing parseable, or null if HTML can't
 * be parsed in this environment.
 */
export function parseHtmlToBlocks(html) {
  if (!html || typeof DOMParser === 'undefined') return null;
  let doc;
  try {
    doc = new DOMParser().parseFromString(html, 'text/html');
  } catch {
    return null;
  }
  if (!doc || !doc.body) return null;
  const out = [];
  elementToBlocks(doc.body, out);
  return out;
}