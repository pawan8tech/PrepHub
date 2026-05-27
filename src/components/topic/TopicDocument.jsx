import {
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  createElement,
} from 'react';
import {
  ensureDocumentShape,
  migrateHeadingValueToBlocks,
  isStorageBlockShape,
  DOCUMENT_ROOT_KEY,
  orderedDocumentSectionKeys,
} from '../../utils/documentContent';
import { useNotes } from '../../context/NotesContext';
import { createBlock, updateBlock, insertBlockAfter, deleteBlock } from '../../utils/editorBlockModel';
import { storageRootToDraftBlocks, isDraftPassthrough } from '../../utils/editorBlockStorageBridge';
import { getCaretCoordinates } from '../../utils/getCaretCoordinates';
import {
  getSlashMenuState,
  filterBlockConvertCommands,
  removeSlashToken,
} from './slashCommandMenu';
const HEADINGS = ['h2', 'h3', 'h4', 'h5', 'h6'];

function cloneBlocksForPersistence(blocks) {
  if (!Array.isArray(blocks) || blocks.length === 0) return [];
  try {
    return JSON.parse(JSON.stringify(blocks));
  } catch {
    return [];
  }
}

function cloneBlocksForEditor(blocks) {
  const copy = cloneBlocksForPersistence(blocks);
  return copy.length > 0 ? copy : [createBlock('text')];
}

function stripEditorIdForView(b) {
  if (!b || typeof b !== 'object') return b;
  const { id: _i, ...rest } = b;
  return rest;
}

function isStorageBlockEmpty(b) {
  if (!b || typeof b !== 'object') return true;
  switch (b.type) {
    case 'text':
    case 'heading':
    case 'callout':
    case 'code':
      return !String(b.content ?? '').trim();
    case 'list': {
      const items = Array.isArray(b.items) ? b.items.map(String) : [];
      return items.every((x) => !x.trim());
    }
    case 'table': {
      const headers = Array.isArray(b.headers) ? b.headers : [];
      const rows = Array.isArray(b.rows) ? b.rows : [];
      return (
        headers.every((h) => !String(h ?? '').trim()) &&
        rows.every((r) => {
          const cells = Array.isArray(r?.cells) ? r.cells : Array.isArray(r) ? r : [];
          return cells.every((c) => !String(c ?? '').trim());
        })
      );
    }
    case 'image':
      return !String(b.url ?? '').trim();
    case 'qna': {
      const qEmpty = !String(b.question ?? '').trim();
      const answer = Array.isArray(b.answer) ? b.answer : [];
      return qEmpty && answer.every(isStorageBlockEmpty);
    }
    default:
      return false;
  }
}

function headingViewCls(level) {
  const sizes = { 1: 'text-2xl', 2: 'text-xl', 3: 'text-lg', 4: 'text-base', 5: 'text-sm', 6: 'text-sm' };
  return `${sizes[level] ?? 'text-xl'} mb-3 mt-6 font-semibold tracking-tight text-surface-900 dark:text-surface-50`;
}

function ViewModeBlockRow({ block, depth }) {
  if (!block || typeof block !== 'object') {
    return (
      <p className="text-sm text-surface-600 dark:text-surface-400">{String(block)}</p>
    );
  }
  if (block.type === 'heading') {
    const lv = Math.min(6, Math.max(1, Number(block.level) || 2));
    const tagIndex = Math.min(Math.max(0, lv - 2), HEADINGS.length - 1);
    const tag = HEADINGS[tagIndex];
    return createElement(
      tag,
      { className: headingViewCls(lv) },
      typeof block.content === 'string' ? block.content : '',
    );
  }
  if (isStorageBlockShape(block) || isDraftPassthrough(block)) {
    return <ContentBlockView block={stripEditorIdForView(block)} depth={depth} />;
  }
  return (
    <p className="text-sm text-surface-600 dark:text-surface-400">{String(block.type || block)}</p>
  );
}

export function BlockSequenceView({ blocks, depth = 0 }) {
  if (!Array.isArray(blocks) || blocks.length === 0) return null;
  return (
    <div className={depth === 0 ? 'max-w-3xl space-y-4' : 'mt-5 space-y-4'}>
      {blocks.map((block, i) => (
        <ViewModeBlockRow key={block && typeof block === 'object' && block.id ? block.id : `vb-${i}`} block={block} depth={depth} />
      ))}
    </div>
  );
}

function DocumentBlock({ heading, value, depth }) {
  const tag = HEADINGS[Math.min(depth, HEADINGS.length - 1)];
  return (
    <section className="scroll-mt-4">
      {createElement(tag, { className: headingViewCls(depth + 2) }, heading)}
      <DocumentValue value={value} depth={depth} />
    </section>
  );
}

function DocumentValue({ value, depth }) {
  if (value == null) return null;
  const blocks = migrateHeadingValueToBlocks(value);
  if (!blocks.length) return null;
  return (
    <div className="max-w-3xl space-y-4">
      {blocks.map((block, i) => (
        <ContentBlockView key={`${block.type}-${i}`} block={block} depth={depth} />
      ))}
    </div>
  );
}

function ContentBlockView({ block, depth }) {
  if (!isStorageBlockShape(block)) {
    return (
      <p className="text-sm text-surface-600 dark:text-surface-400">{String(block)}</p>
    );
  }

  switch (block.type) {
    case 'text':
      return (
        <p className="whitespace-pre-line text-[15px] leading-[1.75] text-surface-700 dark:text-surface-300">
          {typeof block.content === 'string' ? block.content : ''}
        </p>
      );
    case 'list': {
      const items = Array.isArray(block.items) ? block.items : [];
      if (!items.length) return null;
      return (
        <ul className="list-none space-y-2.5 pl-0 text-[15px] leading-relaxed text-surface-700 dark:text-surface-300">
          {items.map((item, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-surface-400 dark:bg-surface-500" aria-hidden />
              <span className="min-w-0 flex-1 whitespace-pre-line">{typeof item === 'string' ? item : JSON.stringify(item)}</span>
            </li>
          ))}
        </ul>
      );
    }
    case 'code':
      return (
        <pre className="overflow-x-auto rounded-lg bg-surface-100 px-4 py-3 text-[13px] leading-relaxed text-surface-800 dark:bg-surface-900 dark:text-surface-100">
          {block.language ? (
            <div className="mb-2 text-[11px] uppercase tracking-wide text-surface-400 dark:text-surface-500">{block.language}</div>
          ) : null}
          <code>{typeof block.content === 'string' ? block.content : ''}</code>
        </pre>
      );
    case 'callout': {
      const v =
        block.variant === 'warning'
          ? 'warning'
          : block.variant === 'tip'
            ? 'tip'
            : block.variant === 'important'
              ? 'important'
              : 'info';
      const label =
        v === 'warning' ? 'Warning' : v === 'tip' ? 'Tip' : v === 'important' ? 'Important' : 'Info';
      const box =
        v === 'warning'
          ? 'border-l-amber-500 bg-amber-50 text-amber-950 dark:border-amber-400 dark:bg-amber-950/40 dark:text-amber-100'
          : v === 'tip'
            ? 'border-l-emerald-500 bg-emerald-50 text-emerald-950 dark:border-emerald-400 dark:bg-emerald-950/40 dark:text-emerald-100'
            : v === 'important'
              ? 'border-l-red-500 bg-red-50 text-red-950 dark:border-red-400 dark:bg-red-950/40 dark:text-red-100'
              : 'border-l-blue-500 bg-blue-50 text-blue-950 dark:border-blue-400 dark:bg-blue-950/40 dark:text-blue-100';
      return (
        <aside
          className={`rounded-r-lg border-l-4 py-3 pl-4 pr-4 text-[15px] leading-relaxed ${box}`}
          aria-label={label}
        >
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
          <p className="whitespace-pre-line">{typeof block.content === 'string' ? block.content : ''}</p>
        </aside>
      );
    }
    case 'table': {
      const { headers = [], rows = [] } = block;
      if (!headers.length) return null;
      return (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[14px]">
            <thead>
              <tr>
                {headers.map((h, i) => (
                  <th
                    key={i}
                    className="border border-surface-200 bg-surface-50 px-3 py-1.5 text-left font-semibold text-surface-900 dark:border-surface-700 dark:bg-surface-800/60 dark:text-surface-100"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => {
                const cells = Array.isArray(row?.cells) ? row.cells : Array.isArray(row) ? row : [];
                return (
                  <tr key={ri}>
                    {cells.map((cell, ci) => (
                      <td
                        key={ci}
                        className="border border-surface-200 px-3 py-1.5 align-top text-surface-700 dark:border-surface-700 dark:text-surface-300"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }
    case 'image': {
      const cap = typeof block.caption === 'string' ? block.caption.trim() : '';
      const url = typeof block.url === 'string' ? block.url.trim() : '';
      return (
        <figure>
          {url ? (
            <img
              src={url}
              alt={cap || ''}
              className="max-h-[min(28rem,70vh)] w-auto rounded-md object-contain"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <p className="text-sm italic text-surface-500 dark:text-surface-400">No image URL</p>
          )}
          {cap ? (
            <figcaption className="mt-2 text-sm text-surface-600 dark:text-surface-400">
              {cap}
            </figcaption>
          ) : null}
        </figure>
      );
    }
    case 'group':
      if (block.content && typeof block.content === 'object') {
        return <DocumentRenderer data={block.content} depth={depth + 1} />;
      }
      return null;
    case 'qna': {
      const q = typeof block.question === 'string' ? block.question : '';
      const answer = Array.isArray(block.answer) ? block.answer : [];
      const hasAnswer = answer.some((b) => !isStorageBlockEmpty(b));
      if (!q.trim() && !hasAnswer) return null;
      return (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 px-4 py-3 dark:border-indigo-800/60 dark:bg-indigo-950/30">
          <div className="flex gap-2 text-[15px] leading-relaxed">
            <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white dark:bg-indigo-500">
              Q
            </span>
            <p className="whitespace-pre-line font-medium text-surface-900 dark:text-surface-100">
              {q}
            </p>
          </div>
          {hasAnswer ? (
            <div className="mt-2 flex gap-2">
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white dark:bg-emerald-500">
                A
              </span>
              <div className="min-w-0 flex-1">
                <BlockSequenceView blocks={answer} depth={0} />
              </div>
            </div>
          ) : null}
        </div>
      );
    }
    default:
      return null;
  }
}

const inputGhost =
  'w-full border-0 bg-transparent p-0 shadow-none outline-none ring-0 focus:ring-0 placeholder:text-surface-400/70';

/** Enter: new paragraph block below; content after caret moves into it (Shift+Enter keeps soft line breaks). */
function splitRichTextBlock(blocks, blockId, value, caret) {
  const idx = blocks.findIndex((b) => b?.id === blockId);
  if (idx === -1) return blocks;
  const cur = blocks[idx];
  if (!cur || isDraftPassthrough(cur) || cur.type === 'list' || cur.type === 'table') return blocks;
  if (typeof cur.content !== 'string' && cur.type !== 'code') return blocks;
  const before = value.slice(0, caret);
  const after = value.slice(caret);
  const patched = updateBlock(blocks, blockId, { content: before });
  return insertBlockAfter(patched, idx, createBlock('text', { content: after }));
}

function isRichBlockEmpty(block) {
  if (!block || isDraftPassthrough(block)) return false;
  if (block.type === 'list') {
    const items = Array.isArray(block.items) && block.items.length ? block.items.map(String) : [''];
    return items.every((x) => !String(x).trim());
  }
  if (block.type === 'code' || block.type === 'text' || block.type === 'heading' || block.type === 'callout') {
    return !String(block.content ?? '').trim();
  }
  if (block.type === 'qna') {
    const qEmpty = !String(block.question ?? '').trim();
    const answer = Array.isArray(block.answer) ? block.answer : [];
    const aEmpty = answer.length === 0 || answer.every(isStorageBlockEmpty);
    return qEmpty && aEmpty;
  }
  return false;
}

function navFocusIds(blocks) {
  const ids = [];
  for (const b of blocks) {
    if (!b || isDraftPassthrough(b)) continue;
    if (b.type === 'list') {
      const items = Array.isArray(b.items) && b.items.length ? b.items.map(String) : [''];
      for (let i = 0; i < items.length; i += 1) ids.push(`${b.id}:${i}`);
    } else {
      ids.push(b.id);
    }
  }
  return ids;
}

function caretLineMetrics(value, pos) {
  const lineStart = value.lastIndexOf('\n', pos - 1) + 1;
  const nextNl = value.indexOf('\n', pos);
  const lineEnd = nextNl === -1 ? value.length : nextNl;
  const lineIndex = value.slice(0, pos).split('\n').length - 1;
  const lineCount = Math.max(1, value.split('\n').length);
  const col = pos - lineStart;
  return {
    lineIndex,
    lineCount,
    col,
    atLineStart: col === 0,
    atLineEnd: pos === lineEnd,
    onFirstLine: lineIndex === 0,
    onLastLine: lineIndex === lineCount - 1,
  };
}

function isCollapsedAtBlockNavUp(ta) {
  const p = ta.selectionStart;
  if (p !== ta.selectionEnd) return false;
  const v = ta.value;
  const m = caretLineMetrics(v, p);
  return m.onFirstLine && m.atLineStart;
}

function isCollapsedAtBlockNavDown(ta) {
  const p = ta.selectionStart;
  if (p !== ta.selectionEnd) return false;
  const v = ta.value;
  const m = caretLineMetrics(v, p);
  return m.onLastLine && m.atLineEnd;
}

function mergeListItemCleaned(block, itemIndex, cleanedItem) {
  const its = [...(Array.isArray(block.items) ? block.items : []).map(String)];
  while (its.length <= itemIndex) its.push('');
  its[itemIndex] = cleanedItem;
  return its.join('\n');
}

/** Build a fresh block for a slash command — used when inserting after the current block. */
function createBlockFromCommand(command) {
  switch (command) {
    case 'text':
      return createBlock('text');
    case 'heading':
    case 'h2':
      return createBlock('heading', { level: 2 });
    case 'h1':
      return createBlock('heading', { level: 1 });
    case 'h3':
      return createBlock('heading', { level: 3 });
    case 'list':
      return createBlock('list', { items: [''] });
    case 'code':
      return createBlock('code', { language: 'text' });
    case 'callout':
      return createBlock('callout', { variant: 'info' });
    case 'important':
      return createBlock('callout', { variant: 'important' });
    case 'warning':
      return createBlock('callout', { variant: 'warning' });
    case 'tip':
      return createBlock('callout', { variant: 'tip' });
    case 'table':
      return createBlock('table');
    case 'qna':
      return createBlock('qna');
    default:
      return createBlock('text');
  }
}

function applyBlockConvert(blocks, blockId, command, seed) {
  const b = blocks.find((x) => x?.id === blockId);
  if (!b || isDraftPassthrough(b)) return blocks;
  const id = b.id;
  let next;
  switch (command) {
    case 'text':
      next = createBlock('text', { id, content: seed });
      break;
    case 'heading':
      next = createBlock('heading', { id, level: 2, content: seed });
      break;
    case 'h1':
      next = createBlock('heading', { id, level: 1, content: seed });
      break;
    case 'h2':
      next = createBlock('heading', { id, level: 2, content: seed });
      break;
    case 'h3':
      next = createBlock('heading', { id, level: 3, content: seed });
      break;
    case 'list': {
      const items = seed
        .split(/\n/)
        .map((s) => s.trimEnd())
        .filter((s) => s.length > 0);
      next = createBlock('list', { id, items: items.length ? items : [''] });
      break;
    }
    case 'code':
      next = createBlock('code', {
        id,
        content: seed,
        language: b.type === 'code' && b.language ? String(b.language) : 'text',
      });
      break;
    case 'callout':
      next = createBlock('callout', {
        id,
        content: seed,
        variant:
          b.type === 'callout' &&
          (b.variant === 'warning' || b.variant === 'tip' || b.variant === 'info' || b.variant === 'important')
            ? b.variant
            : 'info',
      });
      break;
    case 'important':
      next = createBlock('callout', { id, content: seed, variant: 'important' });
      break;
    case 'warning':
      next = createBlock('callout', { id, content: seed, variant: 'warning' });
      break;
    case 'tip':
      next = createBlock('callout', { id, content: seed, variant: 'tip' });
      break;
    case 'table':
      next = createBlock('table', { id });
      break;
    case 'qna':
      next = createBlock('qna', { id, question: seed });
      break;
    default:
      return blocks;
  }
  return blocks.map((x) => (x.id === id ? next : x));
}

export function BlockListEditor({ blocks, onChange, depth, allowQna = true }) {
  const taRefs = useRef({});
  const wrapRefs = useRef({});
  const [focusTarget, setFocusTarget] = useState(null);
  const [slash, setSlash] = useState(null);
  /** Menu highlight index only — not stored on `slash` so syncSlashFromField never resets it. */
  const [slashActiveIndex, setSlashActiveIndex] = useState(0);
  const [menuOffset, setMenuOffset] = useState({ top: 0, left: 0 });
  const slashMenuRef = useRef(null);
  /** Latest slash for key handlers (avoids stale closure on rapid Arrow keys). */
  const slashRef = useRef(null);
  slashRef.current = slash;
  const slashActiveIndexRef = useRef(0);
  slashActiveIndexRef.current = slashActiveIndex;
  /** Session identity for slash menu: open location + filter query (reset active index when this changes). */
  const slashSessionKeyRef = useRef('');

  useEffect(() => {
    if (!focusTarget) return;
    const el = taRefs.current[focusTarget.id];
    if (el && typeof el.focus === 'function') {
      el.focus();
      const v = el.value ?? '';
      const at = focusTarget.caret === 'start' ? 0 : v.length;
      if (typeof el.setSelectionRange === 'function') el.setSelectionRange(at, at);
    }
    setFocusTarget(null);
  }, [focusTarget, blocks]);

  useLayoutEffect(() => {
    if (slash == null || !slash.filtered?.length) return;
    const menu = slashMenuRef.current;
    if (!menu) return;
    const items = menu.querySelectorAll('[data-slash-item]');
    const i = Math.max(0, Math.min(slashActiveIndex, slash.filtered.length - 1));
    items[i]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [slashActiveIndex, slash?.filtered?.length, slash?.blockId, slash?.listItemIndex]);

  const slashMenuOpenHere = useCallback(
    (blockId, listItemIndex) =>
      Boolean(
        slash &&
          slash.blockId === blockId &&
          slash.listItemIndex === listItemIndex &&
          (slash.filtered?.length ?? 0) > 0,
      ),
    [slash],
  );

  const tryCrossBlockNav = useCallback(
    (e, focusKey, blockId, listItemIndex, ta) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return false;
      if (e.shiftKey || e.altKey || e.metaKey || e.ctrlKey) return false;
      if (slashMenuOpenHere(blockId, listItemIndex)) return false;
      const ids = navFocusIds(blocks);
      const idx = ids.indexOf(focusKey);
      if (idx === -1) return false;
      if (e.key === 'ArrowUp') {
        if (!isCollapsedAtBlockNavUp(ta)) return false;
        if (idx <= 0) return false;
        e.preventDefault();
        setFocusTarget({ id: ids[idx - 1], caret: 'end' });
        return true;
      }
      if (!isCollapsedAtBlockNavDown(ta)) return false;
      if (idx >= ids.length - 1) return false;
      e.preventDefault();
      setFocusTarget({ id: ids[idx + 1], caret: 'start' });
      return true;
    },
    [blocks, slashMenuOpenHere],
  );

  const removeBlock = useCallback(
    (blockId) => {
      const idx = blocks.findIndex((b) => b?.id === blockId);
      if (idx === -1) return;
      const editable = blocks.filter((b) => b && !isDraftPassthrough(b));
      if (editable.length <= 1) {
        const nb = createBlock('text');
        onChange(blocks.map((b) => (b?.id === blockId ? nb : b)));
        setFocusTarget({ id: nb.id, caret: 'start' });
        return;
      }
      let nextNeighbor = null;
      for (let i = idx + 1; i < blocks.length; i += 1) {
        if (blocks[i] && !isDraftPassthrough(blocks[i])) {
          nextNeighbor = blocks[i];
          break;
        }
      }
      let prevNeighbor = null;
      for (let i = idx - 1; i >= 0; i -= 1) {
        if (blocks[i] && !isDraftPassthrough(blocks[i])) {
          prevNeighbor = blocks[i];
          break;
        }
      }
      onChange(deleteBlock(blocks, blockId));
      const target = nextNeighbor || prevNeighbor;
      if (!target) return;
      const focusBackward = target === prevNeighbor;
      let focusId = target.id;
      if (target.type === 'list') {
        const items = Array.isArray(target.items) && target.items.length ? target.items : [''];
        focusId = `${target.id}:${focusBackward ? items.length - 1 : 0}`;
      }
      setFocusTarget({ id: focusId, caret: focusBackward ? 'end' : 'start' });
    },
    [blocks, onChange],
  );

  const tryDeleteEmptyBlock = useCallback(
    (e, block) => {
      if (e.key !== 'Backspace') return false;
      if (e.shiftKey || e.altKey || e.metaKey || e.ctrlKey) return false;
      if (!block || isDraftPassthrough(block) || block.type === 'list') return false;
      if (!isRichBlockEmpty(block)) return false;
      const editable = blocks.filter((b) => b && !isDraftPassthrough(b));
      if (editable.length <= 1) {
        e.preventDefault();
        return true;
      }
      const ids = navFocusIds(blocks);
      const idx = ids.indexOf(block.id);
      if (idx === -1) return false;
      const prevId = idx > 0 ? ids[idx - 1] : null;
      const nextId = idx < ids.length - 1 ? ids[idx + 1] : null;
      e.preventDefault();
      onChange(deleteBlock(blocks, block.id));
      if (prevId) setFocusTarget({ id: prevId, caret: 'end' });
      else if (nextId) setFocusTarget({ id: nextId, caret: 'start' });
      return true;
    },
    [blocks, onChange],
  );

  const tryListItemBackspace = useCallback(
    (e, block, items, li) => {
      if (e.key !== 'Backspace') return false;
      if (e.shiftKey || e.altKey || e.metaKey || e.ctrlKey) return false;
      const row = String(items[li] ?? '');
      if (row.trim() !== '') return false;
      if (items.length > 1) {
        e.preventDefault();
        const nextItems = items.filter((_, i) => i !== li);
        onChange(updateBlock(blocks, block.id, { items: nextItems }));
        requestAnimationFrame(() => {
          if (li > 0) setFocusTarget({ id: `${block.id}:${li - 1}`, caret: 'end' });
          else setFocusTarget({ id: `${block.id}:0`, caret: 'start' });
        });
        return true;
      }
      if (!isRichBlockEmpty(block)) return false;
      const editable = blocks.filter((b) => b && !isDraftPassthrough(b));
      if (editable.length <= 1) {
        e.preventDefault();
        return true;
      }
      const ids = navFocusIds(blocks);
      const focusKey = `${block.id}:${li}`;
      const idx = ids.indexOf(focusKey);
      if (idx === -1) return false;
      const prevId = idx > 0 ? ids[idx - 1] : null;
      const nextId = idx < ids.length - 1 ? ids[idx + 1] : null;
      e.preventDefault();
      onChange(deleteBlock(blocks, block.id));
      if (prevId) setFocusTarget({ id: prevId, caret: 'end' });
      else if (nextId) setFocusTarget({ id: nextId, caret: 'start' });
      return true;
    },
    [blocks, onChange],
  );

  const syncSlashFromField = useCallback((blockId, listItemIndex, ta, wrap) => {
    if (!ta || !wrap) {
      slashSessionKeyRef.current = '';
      setSlash(null);
      return;
    }
    const v = ta.value;
    const cur = ta.selectionStart;
    const s = getSlashMenuState(v, cur);
    if (!s) {
      slashSessionKeyRef.current = '';
      setSlash(null);
      return;
    }
    const filtered = filterBlockConvertCommands(s.query, { allowQna });
    if (!filtered.length) {
      slashSessionKeyRef.current = '';
      setSlash(null);
      return;
    }
    const sessionKey = JSON.stringify([blockId, listItemIndex ?? null, s.query]);
    if (slashSessionKeyRef.current !== sessionKey) {
      slashSessionKeyRef.current = sessionKey;
      setSlashActiveIndex(0);
    } else {
      setSlashActiveIndex((ai) => Math.min(ai, Math.max(0, filtered.length - 1)));
    }
    const pos = getCaretCoordinates(ta, wrap);
    setMenuOffset(pos);
    setSlash({
      blockId,
      listItemIndex,
      token: s,
      filtered,
      ta,
      wrap,
    });
  }, [allowQna]);

  useLayoutEffect(() => {
    if (!slash?.ta || !slash.wrap) return;
    setMenuOffset(getCaretCoordinates(slash.ta, slash.wrap));
  }, [slash?.token?.end, slash?.token?.query, slash?.filtered?.length, blocks]);

  useEffect(() => {
    if (!slash) return undefined;
    const onDocDown = (e) => {
      if (e.target.closest?.('[data-slash-block-menu]')) return;
      if (slash.ta && slash.wrap?.contains?.(e.target)) return;
      setSlash(null);
    };
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, [slash]);

  const closeSlash = useCallback(() => {
    slashSessionKeyRef.current = '';
    setSlash(null);
    setSlashActiveIndex(0);
  }, []);

  const applySlashPick = useCallback(
    (commandValue) => {
      const snap = slashRef.current;
      if (!snap) return;
      const { blockId, listItemIndex, token, ta } = snap;
      const v = ta.value;
      const cleaned = removeSlashToken(v, token);
      const block = blocks.find((b) => b.id === blockId);
      if (!block) {
        closeSlash();
        return;
      }

      if (token.start === 0) {
        const seed =
          block.type === 'list' && typeof listItemIndex === 'number'
            ? mergeListItemCleaned(block, listItemIndex, cleaned)
            : cleaned;
        const next = applyBlockConvert(blocks, blockId, commandValue, seed);
        onChange(next);
        closeSlash();
        const nb = next.find((x) => x.id === blockId);
        requestAnimationFrame(() => {
          if (nb?.type === 'list') {
            const row = typeof listItemIndex === 'number' ? listItemIndex : 0;
            const safeRow = Math.min(Math.max(0, row), Math.max(0, (nb.items?.length ?? 1) - 1));
            const el = taRefs.current[`${blockId}:${safeRow}`];
            el?.focus?.();
            const len = el?.value?.length ?? 0;
            el?.setSelectionRange?.(len, len);
          } else {
            const el = taRefs.current[blockId];
            el?.focus?.();
            const len = el?.value?.length ?? 0;
            el?.setSelectionRange?.(len, len);
          }
        });
        return;
      }

      let withCleaned;
      if (block.type === 'list' && typeof listItemIndex === 'number') {
        const items = [...(block.items || []).map(String)];
        items[listItemIndex] = cleaned;
        withCleaned = updateBlock(blocks, blockId, { items });
      } else {
        withCleaned = updateBlock(blocks, blockId, { content: cleaned });
      }
      const newBlock = createBlockFromCommand(commandValue);
      const idx = withCleaned.findIndex((b) => b?.id === blockId);
      const next = insertBlockAfter(withCleaned, idx, newBlock);
      onChange(next);
      closeSlash();
      const focusId = newBlock.type === 'list' ? `${newBlock.id}:0` : newBlock.id;
      setFocusTarget({ id: focusId, caret: 'start' });
    },
    [blocks, onChange, closeSlash],
  );

  const handleSlashKeyDown = useCallback(
    (e, blockId, listItemIndex) => {
      const snap = slashRef.current;
      const menuOpen =
        snap &&
        snap.blockId === blockId &&
        snap.listItemIndex === listItemIndex &&
        (snap.filtered?.length ?? 0) > 0;

      if (
        import.meta.env.DEV &&
        (menuOpen ||
          e.key === 'ArrowDown' ||
          e.key === 'ArrowUp' ||
          (e.key === 'Enter' && !e.shiftKey))
      ) {
        // Temporary: verify textarea handler + menu state (remove when slash UX is stable)
        const ta = e.currentTarget;
        const sm =
          ta && typeof ta.selectionStart === 'number' ? getSlashMenuState(ta.value, ta.selectionStart) : null;
        console.log('[slash-menu] keydown', e.key, {
          blockId,
          listItemIndex,
          menuOpen,
          slashActiveIndex: slashActiveIndexRef.current,
          cursorInSlashToken: Boolean(sm),
        });
      }

      if (!menuOpen) return;

      const filtered = snap.filtered;
      const len = filtered.length;

      if (e.key === 'Escape') {
        e.preventDefault();
        const ta = e.currentTarget;
        const cleaned = removeSlashToken(ta.value, snap.token);
        if (typeof listItemIndex === 'number') {
          const block = blocks.find((b) => b.id === blockId);
          if (block?.type === 'list') {
            const its = [...(block.items || []).map(String)];
            its[listItemIndex] = cleaned;
            onChange(updateBlock(blocks, blockId, { items: its }));
          }
        } else {
          onChange(updateBlock(blocks, blockId, { content: cleaned }));
        }
        closeSlash();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        setSlashActiveIndex((i) => {
          const cur = Math.max(0, Math.min(i, len - 1));
          return Math.min(cur + 1, len - 1);
        });
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        setSlashActiveIndex((i) => {
          const cur = Math.max(0, Math.min(i, len - 1));
          return Math.max(cur - 1, 0);
        });
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        const idx = Math.max(0, Math.min(slashActiveIndexRef.current, len - 1));
        const cmd = filtered[idx];
        if (cmd) applySlashPick(cmd.value);
      }
    },
    [blocks, onChange, closeSlash, applySlashPick],
  );

  function SlashBlockMenu({ blockId, listItemIndex }) {
    if (
      !slash ||
      slash.blockId !== blockId ||
      slash.listItemIndex !== listItemIndex ||
      !slash.filtered?.length
    ) {
      return null;
    }
    return (
      <ul
        ref={slashMenuRef}
        data-slash-block-menu
        role="listbox"
        style={{
          position: 'absolute',
          top: menuOffset.top,
          left: menuOffset.left,
          zIndex: 50,
          minWidth: '11rem',
        }}
        className="max-h-56 overflow-y-auto rounded-lg border border-surface-200 bg-white py-1 text-sm shadow-lg dark:border-surface-600 dark:bg-surface-900"
      >
        {slash.filtered.map((cmd, idx) => {
          const activeIdx = Math.max(0, Math.min(slashActiveIndex, slash.filtered.length - 1));
          const isActive = idx === activeIdx;
          return (
          <li key={cmd.value} data-slash-item role="option" aria-selected={isActive}>
            <button
              type="button"
              tabIndex={-1}
              className={`flex w-full px-3 py-1.5 text-left ${
                isActive
                  ? 'bg-primary-50 text-primary-900 ring-1 ring-inset ring-primary-200 dark:bg-primary-950/50 dark:text-primary-100 dark:ring-primary-800'
                  : 'text-surface-800 dark:text-surface-100'
              }`}
              onMouseDown={(ev) => {
                ev.preventDefault();
                ev.stopPropagation();
              }}
              onMouseEnter={() => {
                setSlashActiveIndex(idx);
              }}
              onClick={(ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                applySlashPick(cmd.value);
              }}
            >
              <span className="font-medium">{cmd.label}</span>
              <span className="ml-2 text-xs text-surface-500">/{cmd.value}</span>
            </button>
          </li>
          );
        })}
      </ul>
    );
  }

  if (!blocks.length) return null;

  return (
    <div className="max-w-3xl space-y-4">
      {blocks.map((block, blockIndex) => {
        if (isDraftPassthrough(block)) {
          return (
            <div key={block.id}>
              <ContentBlockView block={stripEditorIdForView(block)} depth={depth} />
            </div>
          );
        }

        if (block.type === 'heading') {
          const lv = Math.min(6, Math.max(1, Number(block.level) || 2));
          const sizeCls = ['text-2xl', 'text-xl', 'text-lg', 'text-base', 'text-base', 'text-sm'][lv - 1];
          return (
            <div key={block.id} className={`${sizeCls} font-semibold tracking-tight text-surface-900 dark:text-surface-50`}>
              <div
                ref={(el) => {
                  wrapRefs.current[block.id] = el;
                }}
                className="relative"
              >
                <textarea
                  ref={(el) => {
                    taRefs.current[block.id] = el;
                  }}
                  value={typeof block.content === 'string' ? block.content : ''}
                  onChange={(e) => {
                    onChange(updateBlock(blocks, block.id, { content: e.target.value }));
                    syncSlashFromField(block.id, undefined, e.currentTarget, wrapRefs.current[block.id]);
                  }}
                  onSelect={(e) =>
                    syncSlashFromField(block.id, undefined, e.currentTarget, wrapRefs.current[block.id])
                  }
                  onKeyDown={(e) => {
                    handleSlashKeyDown(e, block.id, undefined);
                    if (e.defaultPrevented) return;
                    if (tryDeleteEmptyBlock(e, block)) return;
                    if (tryCrossBlockNav(e, block.id, block.id, undefined, e.currentTarget)) return;
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      const next = splitRichTextBlock(blocks, block.id, e.target.value, e.target.selectionStart);
                      onChange(next);
                      const ni = next[blockIndex + 1]?.id;
                      if (ni) setFocusTarget({ id: ni, caret: 'start' });
                    }
                  }}
                  rows={Math.max(1, String(block.content ?? '').split('\n').length)}
                  className={`block min-h-[1.5em] w-full resize-none whitespace-pre-line leading-snug ${inputGhost}`}
                  aria-label="Heading"
                  placeholder={`Heading ${lv}`}
                />
                <SlashBlockMenu blockId={block.id} listItemIndex={undefined} />
              </div>
            </div>
          );
        }

        if (block.type === 'text') {
          return (
            <div
              key={block.id}
              ref={(el) => {
                wrapRefs.current[block.id] = el;
              }}
              className="relative"
            >
              <textarea
                ref={(el) => {
                  taRefs.current[block.id] = el;
                }}
                value={typeof block.content === 'string' ? block.content : ''}
                onChange={(e) => {
                  onChange(updateBlock(blocks, block.id, { content: e.target.value }));
                  syncSlashFromField(block.id, undefined, e.currentTarget, wrapRefs.current[block.id]);
                }}
                onSelect={(e) =>
                  syncSlashFromField(block.id, undefined, e.currentTarget, wrapRefs.current[block.id])
                }
                onKeyDown={(e) => {
                  handleSlashKeyDown(e, block.id, undefined);
                  if (e.defaultPrevented) return;
                  if (tryDeleteEmptyBlock(e, block)) return;
                  if (tryCrossBlockNav(e, block.id, block.id, undefined, e.currentTarget)) return;
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const next = splitRichTextBlock(blocks, block.id, e.target.value, e.target.selectionStart);
                    onChange(next);
                    const ni = next[blockIndex + 1]?.id;
                    if (ni) setFocusTarget({ id: ni, caret: 'start' });
                  }
                }}
                rows={Math.max(2, String(block.content ?? '').split('\n').length)}
                className={`block min-h-[2.5rem] resize-y whitespace-pre-line text-[15px] leading-[1.75] text-surface-700 dark:text-surface-300 ${inputGhost}`}
                aria-label="Text block"
                placeholder="Type '/' for commands, or start writing…"
              />
              <SlashBlockMenu blockId={block.id} listItemIndex={undefined} />
            </div>
          );
        }

        if (block.type === 'list') {
          const items = Array.isArray(block.items) && block.items.length ? block.items.map(String) : [''];
          return (
            <ul key={block.id} className="list-none space-y-2.5 pl-0 text-[15px] leading-relaxed text-surface-700 dark:text-surface-300">
              {items.map((item, li) => (
                <li key={`${block.id}-li-${li}`} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-surface-400 dark:bg-surface-500" aria-hidden />
                  <div
                    ref={(el) => {
                      wrapRefs.current[`${block.id}:${li}`] = el;
                    }}
                    className="relative min-w-0 flex-1"
                  >
                    <textarea
                      ref={(el) => {
                        taRefs.current[`${block.id}:${li}`] = el;
                      }}
                      value={item}
                      onChange={(e) => {
                        const nextItems = [...items];
                        nextItems[li] = e.target.value;
                        onChange(updateBlock(blocks, block.id, { items: nextItems }));
                        syncSlashFromField(
                          block.id,
                          li,
                          e.currentTarget,
                          wrapRefs.current[`${block.id}:${li}`],
                        );
                      }}
                      onSelect={(e) =>
                        syncSlashFromField(
                          block.id,
                          li,
                          e.currentTarget,
                          wrapRefs.current[`${block.id}:${li}`],
                        )
                      }
                      onKeyDown={(e) => {
                        handleSlashKeyDown(e, block.id, li);
                        if (e.defaultPrevented) return;
                        if (tryListItemBackspace(e, block, items, li)) return;
                        if (tryCrossBlockNav(e, `${block.id}:${li}`, block.id, li, e.currentTarget)) return;
                        if (e.key !== 'Enter' || e.shiftKey) return;
                        e.preventDefault();
                        const el = e.currentTarget;
                        const caret = el.selectionStart;
                        const val = el.value;
                        if (li < items.length - 1) {
                          const before = val.slice(0, caret);
                          const after = val.slice(caret);
                          const nextItems = [...items];
                          nextItems[li] = before;
                          nextItems.splice(li + 1, 0, after);
                          onChange(updateBlock(blocks, block.id, { items: nextItems }));
                          setFocusTarget({ id: `${block.id}:${li + 1}`, caret: 'start' });
                          return;
                        }
                        if (caret < val.length) {
                          const before = val.slice(0, caret);
                          const after = val.slice(caret);
                          const nextItems = [...items];
                          nextItems[li] = before;
                          nextItems.push(after);
                          onChange(updateBlock(blocks, block.id, { items: nextItems }));
                          setFocusTarget({ id: `${block.id}:${nextItems.length - 1}`, caret: 'start' });
                          return;
                        }
                        if (val.trim() === '') {
                          const trimmedItems = items.slice(0, -1);
                          const nb = createBlock('text');
                          if (trimmedItems.length === 0) {
                            const afterInsert = insertBlockAfter(blocks, blockIndex, nb);
                            onChange(deleteBlock(afterInsert, block.id));
                          } else {
                            const updated = updateBlock(blocks, block.id, { items: trimmedItems });
                            onChange(insertBlockAfter(updated, blockIndex, nb));
                          }
                          setFocusTarget({ id: nb.id, caret: 'start' });
                          return;
                        }
                        const appendedItems = [...items, ''];
                        onChange(updateBlock(blocks, block.id, { items: appendedItems }));
                        setFocusTarget({ id: `${block.id}:${appendedItems.length - 1}`, caret: 'start' });
                      }}
                      rows={Math.max(1, item.split('\n').length)}
                      className={`min-h-[1.25em] w-full resize-none whitespace-pre-line ${inputGhost}`}
                      aria-label={`List item ${li + 1}`}
                      placeholder="List item"
                    />
                    <SlashBlockMenu blockId={block.id} listItemIndex={li} />
                  </div>
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === 'code') {
          return (
            <div key={block.id} className="group/block relative overflow-x-auto rounded-lg bg-surface-100 px-4 py-3 text-[13px] leading-relaxed text-surface-800 dark:bg-surface-900 dark:text-surface-100">
              <button
                type="button"
                onClick={() => removeBlock(block.id)}
                aria-label="Remove code block"
                title="Remove code block"
                className="absolute right-2 top-2 z-10 hidden h-7 items-center gap-1 rounded-md bg-white px-2 text-xs text-surface-600 shadow-sm ring-1 ring-surface-200 hover:text-red-600 group-hover/block:inline-flex dark:bg-surface-800 dark:text-surface-300 dark:ring-surface-700 dark:hover:text-red-400"
              >
                × Remove
              </button>
              <input
                type="text"
                value={String(block.language || '').trim() || 'text'}
                onChange={(e) => onChange(updateBlock(blocks, block.id, { language: e.target.value || 'text' }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.preventDefault();
                }}
                className={`mb-2 block w-full max-w-xs text-[11px] uppercase tracking-wide text-surface-500 dark:text-surface-400 ${inputGhost}`}
                aria-label="Code language"
              />
              <div
                ref={(el) => {
                  wrapRefs.current[block.id] = el;
                }}
                className="relative"
              >
                <textarea
                  ref={(el) => {
                    taRefs.current[block.id] = el;
                  }}
                  value={typeof block.content === 'string' ? block.content : ''}
                  onChange={(e) => {
                    onChange(updateBlock(blocks, block.id, { content: e.target.value }));
                    syncSlashFromField(block.id, undefined, e.currentTarget, wrapRefs.current[block.id]);
                  }}
                  onSelect={(e) =>
                    syncSlashFromField(block.id, undefined, e.currentTarget, wrapRefs.current[block.id])
                  }
                  onKeyDown={(e) => {
                    handleSlashKeyDown(e, block.id, undefined);
                    if (e.defaultPrevented) return;
                    if (tryDeleteEmptyBlock(e, block)) return;
                    if (tryCrossBlockNav(e, block.id, block.id, undefined, e.currentTarget)) return;
                  }}
                  rows={Math.max(4, String(block.content ?? '').split('\n').length)}
                  spellCheck={false}
                  className={`block w-full resize-y font-mono text-[13px] leading-relaxed text-surface-800 dark:text-surface-100 ${inputGhost}`}
                  aria-label="Code"
                  placeholder="// Paste or type code…"
                />
                <SlashBlockMenu blockId={block.id} listItemIndex={undefined} />
              </div>
            </div>
          );
        }

        if (block.type === 'callout') {
          const v =
            block.variant === 'warning'
              ? 'warning'
              : block.variant === 'tip'
                ? 'tip'
                : block.variant === 'important'
                  ? 'important'
                  : 'info';
          const label =
            v === 'warning' ? 'Warning' : v === 'tip' ? 'Tip' : v === 'important' ? 'Important' : 'Info';
          const box =
            v === 'warning'
              ? 'border-l-amber-500 bg-amber-50 text-amber-950 dark:border-amber-400 dark:bg-amber-950/40 dark:text-amber-100'
              : v === 'tip'
                ? 'border-l-emerald-500 bg-emerald-50 text-emerald-950 dark:border-emerald-400 dark:bg-emerald-950/40 dark:text-emerald-100'
                : v === 'important'
                  ? 'border-l-red-500 bg-red-50 text-red-950 dark:border-red-400 dark:bg-red-950/40 dark:text-red-100'
                  : 'border-l-blue-500 bg-blue-50 text-blue-950 dark:border-blue-400 dark:bg-blue-950/40 dark:text-blue-100';
          return (
            <aside
              key={block.id}
              className={`group/block relative rounded-r-lg border-l-4 py-3 pl-4 pr-4 text-[15px] leading-relaxed ${box}`}
              aria-label={label}
            >
              <button
                type="button"
                onClick={() => removeBlock(block.id)}
                aria-label={`Remove ${label} callout`}
                title={`Remove ${label} callout`}
                className="absolute right-2 top-2 z-10 hidden h-7 items-center gap-1 rounded-md bg-white/90 px-2 text-xs text-surface-700 shadow-sm ring-1 ring-surface-200 hover:text-red-600 group-hover/block:inline-flex dark:bg-surface-800/90 dark:text-surface-200 dark:ring-surface-700 dark:hover:text-red-400"
              >
                × Remove
              </button>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
              <div
                ref={(el) => {
                  wrapRefs.current[block.id] = el;
                }}
                className="relative"
              >
                <textarea
                  ref={(el) => {
                    taRefs.current[block.id] = el;
                  }}
                  value={typeof block.content === 'string' ? block.content : ''}
                  onChange={(e) => {
                    onChange(updateBlock(blocks, block.id, { content: e.target.value }));
                    syncSlashFromField(block.id, undefined, e.currentTarget, wrapRefs.current[block.id]);
                  }}
                  onSelect={(e) =>
                    syncSlashFromField(block.id, undefined, e.currentTarget, wrapRefs.current[block.id])
                  }
                  onKeyDown={(e) => {
                    handleSlashKeyDown(e, block.id, undefined);
                    if (e.defaultPrevented) return;
                    if (tryDeleteEmptyBlock(e, block)) return;
                    if (tryCrossBlockNav(e, block.id, block.id, undefined, e.currentTarget)) return;
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      const next = splitRichTextBlock(blocks, block.id, e.target.value, e.target.selectionStart);
                      onChange(next);
                      const ni = next[blockIndex + 1]?.id;
                      if (ni) setFocusTarget({ id: ni, caret: 'start' });
                    }
                  }}
                  rows={Math.max(2, String(block.content ?? '').split('\n').length)}
                  className={`block min-h-[2rem] w-full resize-y whitespace-pre-line ${inputGhost}`}
                  aria-label="Callout text"
                  placeholder={`Add ${v === 'important' || v === 'info' ? 'an' : 'a'} ${label.toLowerCase()}…`}
                />
                <SlashBlockMenu blockId={block.id} listItemIndex={undefined} />
              </div>
            </aside>
          );
        }

        if (block.type === 'table') {
          const headers = Array.isArray(block.headers) ? block.headers : [];
          const rows = Array.isArray(block.rows) ? block.rows : [];
          const colCount = headers.length;
          const cellsOf = (r) =>
            Array.isArray(r?.cells) ? r.cells : Array.isArray(r) ? r : [];
          const patchTable = (patch) => onChange(updateBlock(blocks, block.id, patch));
          const addColumn = () =>
            patchTable({
              headers: [...headers, ''],
              rows: rows.map((r) => ({ cells: [...cellsOf(r), ''] })),
            });
          const deleteColumn = (ci) => {
            if (colCount <= 1) return;
            patchTable({
              headers: headers.filter((_, i) => i !== ci),
              rows: rows.map((r) => ({ cells: cellsOf(r).filter((_, i) => i !== ci) })),
            });
          };
          const addRow = () =>
            patchTable({
              rows: [
                ...rows,
                { cells: Array.from({ length: Math.max(1, colCount) }, () => '') },
              ],
            });
          const deleteRow = (ri) => patchTable({ rows: rows.filter((_, i) => i !== ri) });

          return (
            <div key={block.id} className="group/block relative pt-7">
              <button
                type="button"
                onClick={() => removeBlock(block.id)}
                aria-label="Remove table"
                title="Remove table"
                className="absolute right-0 top-0 z-10 hidden h-6 items-center gap-1 rounded-md bg-white px-2 text-xs text-surface-700 shadow-sm ring-1 ring-surface-200 hover:text-red-600 group-hover/block:inline-flex dark:bg-surface-800 dark:text-surface-200 dark:ring-surface-700 dark:hover:text-red-400"
              >
                × Remove table
              </button>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[14px]">
                <thead>
                  <tr>
                    {headers.map((h, ci) => (
                      <th
                        key={ci}
                        className="group/col relative border border-surface-200 bg-surface-50 dark:border-surface-700 dark:bg-surface-800/60"
                      >
                        <div className="flex items-center">
                          <input
                            type="text"
                            value={h}
                            onChange={(e) => {
                              const nextHeaders = [...headers];
                              nextHeaders[ci] = e.target.value;
                              patchTable({ headers: nextHeaders });
                            }}
                            className="w-full bg-transparent px-3 py-1.5 font-semibold text-surface-900 outline-none dark:text-surface-100"
                            placeholder={`Column ${ci + 1}`}
                          />
                          {colCount > 1 ? (
                            <button
                              type="button"
                              onClick={() => deleteColumn(ci)}
                              aria-label={`Delete column ${ci + 1}`}
                              title="Delete column"
                              className="mr-1 hidden h-5 w-5 shrink-0 items-center justify-center rounded text-surface-500 hover:bg-surface-200 hover:text-red-600 group-hover/col:flex dark:hover:bg-surface-700 dark:hover:text-red-400"
                            >
                              ×
                            </button>
                          ) : null}
                        </div>
                      </th>
                    ))}
                    <th className="w-10 border border-dashed border-surface-200 dark:border-surface-700">
                      <button
                        type="button"
                        onClick={addColumn}
                        aria-label="Add column"
                        title="Add column"
                        className="flex h-full w-full items-center justify-center px-2 py-1.5 text-surface-500 hover:bg-surface-100 hover:text-surface-800 dark:hover:bg-surface-800 dark:hover:text-surface-100"
                      >
                        +
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, ri) => (
                    <tr key={ri} className="group/row">
                      {cellsOf(row).map((cell, ci) => (
                        <td
                          key={ci}
                          className="border border-surface-200 dark:border-surface-700"
                        >
                          <input
                            type="text"
                            value={cell}
                            onChange={(e) => {
                              const nextRows = rows.map((r, i) => {
                                if (i !== ri) return { cells: [...cellsOf(r)] };
                                const cells = cellsOf(r);
                                return {
                                  cells: [
                                    ...cells.slice(0, ci),
                                    e.target.value,
                                    ...cells.slice(ci + 1),
                                  ],
                                };
                              });
                              patchTable({ rows: nextRows });
                            }}
                            className="w-full bg-transparent px-3 py-1.5 text-surface-700 outline-none placeholder:text-surface-400/60 dark:text-surface-300"
                            placeholder="—"
                          />
                        </td>
                      ))}
                      <td className="w-10 border border-dashed border-surface-200 dark:border-surface-700">
                        <button
                          type="button"
                          onClick={() => deleteRow(ri)}
                          aria-label={`Delete row ${ri + 1}`}
                          title="Delete row"
                          className="hidden h-full w-full items-center justify-center px-2 py-1.5 text-surface-500 hover:bg-surface-100 hover:text-red-600 group-hover/row:flex dark:hover:bg-surface-800 dark:hover:text-red-400"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td
                      colSpan={Math.max(1, colCount) + 1}
                      className="border border-dashed border-surface-200 p-0 dark:border-surface-700"
                    >
                      <button
                        type="button"
                        onClick={addRow}
                        aria-label="Add row"
                        title="Add row"
                        className="flex w-full items-center justify-center px-2 py-1.5 text-surface-500 hover:bg-surface-100 hover:text-surface-800 dark:hover:bg-surface-800 dark:hover:text-surface-100"
                      >
                        + Add row
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
              </div>
              <button
                type="button"
                onClick={() => {
                  const nb = createBlock('text');
                  onChange(insertBlockAfter(blocks, blockIndex, nb));
                  setFocusTarget({ id: nb.id, caret: 'start' });
                }}
                aria-label="Add block below table"
                title="Add a new block below the table"
                className="mt-1 flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-surface-200 px-2 py-1.5 text-xs text-surface-500 transition-colors hover:bg-surface-50 hover:text-surface-800 dark:border-surface-700 dark:hover:bg-surface-800 dark:hover:text-surface-100"
              >
                + Add block below
              </button>
            </div>
          );
        }

        if (block.type === 'qna') {
          const question = typeof block.question === 'string' ? block.question : '';
          const answerBlocks =
            Array.isArray(block.answer) && block.answer.length > 0
              ? block.answer
              : [createBlock('text')];
          const answerEmpty = answerBlocks.every(isRichBlockEmpty);
          return (
            <div
              key={block.id}
              className="group/block relative rounded-lg border border-indigo-200 bg-indigo-50/50 px-4 py-3 dark:border-indigo-800/60 dark:bg-indigo-950/30"
            >
              <button
                type="button"
                onClick={() => removeBlock(block.id)}
                aria-label="Remove Q&A"
                title="Remove Q&A"
                className="absolute right-2 top-2 z-10 hidden h-7 items-center gap-1 rounded-md bg-white px-2 text-xs text-surface-700 shadow-sm ring-1 ring-surface-200 hover:text-red-600 group-hover/block:inline-flex dark:bg-surface-800 dark:text-surface-200 dark:ring-surface-700 dark:hover:text-red-400"
              >
                × Remove
              </button>
              <div className="flex gap-2">
                <span className="mt-1.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white dark:bg-indigo-500">
                  Q
                </span>
                <textarea
                  ref={(el) => {
                    taRefs.current[`${block.id}:q`] = el;
                  }}
                  value={question}
                  onChange={(e) =>
                    onChange(updateBlock(blocks, block.id, { question: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (
                      e.key === 'Backspace' &&
                      question === '' &&
                      answerEmpty &&
                      !e.shiftKey &&
                      !e.altKey &&
                      !e.metaKey &&
                      !e.ctrlKey
                    ) {
                      if (tryDeleteEmptyBlock(e, block)) return;
                    }
                  }}
                  rows={Math.max(1, question.split('\n').length)}
                  className={`min-h-[1.5em] resize-none whitespace-pre-line font-medium text-surface-900 dark:text-surface-100 ${inputGhost}`}
                  aria-label="Question"
                  placeholder="Question"
                />
              </div>
              <div className="mt-2 flex gap-2">
                <span className="mt-1.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white dark:bg-emerald-500">
                  A
                </span>
                <div className="min-w-0 flex-1">
                  <BlockListEditor
                    blocks={answerBlocks}
                    onChange={(nextAnswer) =>
                      onChange(updateBlock(blocks, block.id, { answer: nextAnswer }))
                    }
                    depth={(depth ?? 0) + 1}
                    allowQna={false}
                  />
                </div>
              </div>
            </div>
          );
        }

        return (
          <p key={block.id || blockIndex} className="text-sm text-surface-600 dark:text-surface-400">
            {String(block)}
          </p>
        );
      })}
    </div>
  );
}

export function DocumentRenderer({ data, depth, draftRootBlocks, onDraftRootBlocksChange }) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const { content } = ensureDocumentShape(data);
  const orderedKeys = orderedDocumentSectionKeys(data);
  if (orderedKeys.length === 0) return null;

  const useRootDraft =
    typeof onDraftRootBlocksChange === 'function' && Array.isArray(draftRootBlocks);

  return (
    <div className={depth === 0 ? 'space-y-8' : 'mt-5 space-y-6'}>
      {orderedKeys.map((heading) =>
        heading === DOCUMENT_ROOT_KEY ? (
          <div key={DOCUMENT_ROOT_KEY} className="scroll-mt-4">
            {useRootDraft ? (
              <BlockListEditor blocks={draftRootBlocks} onChange={onDraftRootBlocksChange} depth={depth} />
            ) : (
              <DocumentValue value={content[heading]} depth={depth} />
            )}
          </div>
        ) : (
          <DocumentBlock key={heading} heading={heading} value={content[heading]} depth={depth} />
        ),
      )}
    </div>
  );
}

const DEBUG_TOPIC_DOC = import.meta.env.DEV;

const TopicDocument = forwardRef(function TopicDocument(
  { topicBlocks, topicSlug, mode, editorSeedKey, notesEditing: notesEditingProp, onNotesEditingChange },
  ref,
) {
  const { updateModeDocument } = useNotes();
  const [internalEditing, setInternalEditing] = useState(false);
  const [draftRootBlocks, setDraftRootBlocks] = useState([]);
  const draftRef = useRef([]);
  const wasEditingRef = useRef(false);
  const lastEditorSeedRef = useRef('');

  const controlled = typeof onNotesEditingChange === 'function';
  const editing = controlled ? Boolean(notesEditingProp) : internalEditing;

  const viewBlocks = useMemo(
    () => (Array.isArray(topicBlocks) && topicBlocks.length > 0 ? topicBlocks.slice() : null),
    [topicBlocks],
  );
  const empty = viewBlocks === null;

  useLayoutEffect(() => {
    draftRef.current = draftRootBlocks;
  }, [draftRootBlocks]);

  const setEditing = useCallback(
    (v) => {
      const next = Boolean(v);
      if (controlled) onNotesEditingChange(next);
      else setInternalEditing(next);
    },
    [controlled, onNotesEditingChange],
  );

  const cancelEdit = useCallback(() => {
    setEditing(false);
  }, [setEditing]);

  useLayoutEffect(() => {
    if (!editing) {
      wasEditingRef.current = false;
      lastEditorSeedRef.current = '';
      return;
    }

    const entering = !wasEditingRef.current;
    const seed = editorSeedKey ?? '';
    const seedChanged = seed !== lastEditorSeedRef.current;

    if (entering || seedChanged) {
      if (!empty) {
        setDraftRootBlocks(cloneBlocksForEditor(topicBlocks));
      } else {
        setDraftRootBlocks([createBlock('text')]);
      }
      lastEditorSeedRef.current = seed;
      if (DEBUG_TOPIC_DOC) {
        // eslint-disable-next-line no-console
        console.log('[notes-edit] TopicDocument seed draft', {
          topicSlug,
          mode,
          entering,
          seedChanged,
          editorSeedKey: seed,
        });
      }
    }
    wasEditingRef.current = true;
  }, [editing, topicBlocks, empty, editorSeedKey, topicSlug, mode]);

  const handleSaveDraft = useCallback(async () => {
    const blocks = cloneBlocksForPersistence(draftRef.current);
    await updateModeDocument(topicSlug, mode, { blocks });
    setEditing(false);
  }, [topicSlug, mode, updateModeDocument, setEditing]);

  const handleCancelDraft = useCallback(() => {
    setEditing(false);
  }, [setEditing]);

  useImperativeHandle(
    ref,
    () => ({
      save: () => handleSaveDraft(),
      cancel: () => handleCancelDraft(),
    }),
    [handleSaveDraft, handleCancelDraft],
  );

  return (
    <div className="topic-document">
      {editing ? (
        <BlockListEditor blocks={draftRootBlocks} onChange={setDraftRootBlocks} depth={0} />
        ) : empty ? (
        <p className="text-sm text-surface-500 dark:text-surface-400">
          {mode === 'learning' ? 'No learning notes for this topic yet.' : 'No interview notes for this topic yet.'}
        </p>
      ) : (
        <BlockSequenceView blocks={viewBlocks} depth={0} />
       )}
       </div>
  );
});

export default TopicDocument;
