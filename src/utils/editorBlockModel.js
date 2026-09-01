/**
 * Experimental block-based model for a future editor.
 * Does not replace topic document storage; use alongside existing structures only.
 */

import { newEditorBlockId, normalizeTableShape } from './documentContent';

/** @typedef {'text' | 'heading' | 'list' | 'code' | 'callout' | 'table' | 'qna'} EditorBlockType */

/**
 * @typedef {Object} EditorTextBlock
 * @property {string} id
 * @property {'text'} type
 * @property {string} content
 */

/**
 * @typedef {Object} EditorHeadingBlock
 * @property {string} id
 * @property {'heading'} type
 * @property {number} level
 * @property {string} content
 */

/**
 * @typedef {Object} EditorListBlock
 * @property {string} id
 * @property {'list'} type
 * @property {string[]} items
 */

/**
 * @typedef {Object} EditorCodeBlock
 * @property {string} id
 * @property {'code'} type
 * @property {string} content
 * @property {string} [language]
 */

/**
 * @typedef {Object} EditorCalloutBlock
 * @property {string} id
 * @property {'callout'} type
 * @property {string} content
 * @property {'info' | 'important' | 'warning' | 'tip'} [variant]
 */

/**
 * @typedef {Object} EditorQnaBlock
 * @property {string} id
 * @property {'qna'} type
 * @property {string} question
 * @property {EditorBlock[]} answer — nested blocks of the same shape (default: one empty text block)
 */

/**
 * @typedef {Object} EditorTableBlock
 * @property {string} id
 * @property {'table'} type
 * @property {string[]} headers — column headers; empty strings render the "Column N" placeholder
 * @property {Array<{cells: string[]}>} rows — rows are objects (not arrays) so Firestore accepts them;
 *   every row.cells has exactly headers.length items (normalized on create/update)
 */

/** @typedef {EditorTextBlock | EditorHeadingBlock | EditorListBlock | EditorCodeBlock | EditorCalloutBlock | EditorTableBlock | EditorQnaBlock} EditorBlock */

const HEADING_LEVEL_MIN = 1;
const HEADING_LEVEL_MAX = 6;

function clampHeadingLevel(n) {
  const x = Number(n);
  if (Number.isNaN(x)) return 2;
  return Math.min(HEADING_LEVEL_MAX, Math.max(HEADING_LEVEL_MIN, Math.floor(x)));
}

/**
 * @param {EditorBlockType} type
 * @param {Partial<EditorBlock>} [partial]
 * @returns {EditorBlock}
 */
export function createBlock(type, partial = {}) {
  const id = typeof partial.id === 'string' && partial.id ? partial.id : newEditorBlockId();

  switch (type) {
    case 'text':
      return {
        id,
        type: 'text',
        content: typeof partial.content === 'string' ? partial.content : '',
      };
    case 'heading':
      return {
        id,
        type: 'heading',
        level: clampHeadingLevel(partial.level),
        content: typeof partial.content === 'string' ? partial.content : '',
      };
    case 'list': {
      const items = Array.isArray(partial.items) ? partial.items.map((x) => String(x)) : [''];
      return {
        id,
        type: 'list',
        items: items.length ? items : [''],
      };
    }
    case 'code':
      return {
        id,
        type: 'code',
        content: typeof partial.content === 'string' ? partial.content : '',
        language:
          typeof partial.language === 'string' && partial.language.trim()
            ? partial.language.trim()
            : 'text',
      };
    case 'callout': {
      const v = partial.variant;
      const variant =
        v === 'warning' || v === 'tip' || v === 'info' || v === 'important' ? v : 'info';
      return {
        id,
        type: 'callout',
        content: typeof partial.content === 'string' ? partial.content : '',
        variant,
      };
    }
    case 'table':
      return { id, type: 'table', ...normalizeTableShape(partial) };
    case 'image':
      return {
        id,
        type: 'image',
        url: typeof partial.url === 'string' ? partial.url : '',
        caption: typeof partial.caption === 'string' ? partial.caption : '',
      };
    case 'qna': {
      const incoming = Array.isArray(partial.answer) ? partial.answer : null;
      const answer =
        incoming && incoming.length > 0
          ? incoming.map((b) => createBlock(b?.type || 'text', b || {}))
          : [createBlock('text')];
      return {
        id,
        type: 'qna',
        question: typeof partial.question === 'string' ? partial.question : '',
        answer,
      };
    }
    default:
      return {
        id,
        type: 'text',
        content: '',
      };
  }
}

/**
 * Immutable update: returns a new blocks array with one block patched by id.
 * @param {EditorBlock[]} blocks
 * @param {string} id
 * @param {Partial<EditorBlock>} updates — fields to merge (must match block type)
 * @returns {EditorBlock[]}
 */
export function updateBlock(blocks, id, updates) {
  if (!Array.isArray(blocks)) return [];
  return blocks.map((b) => {
    if (!b || b.id !== id) return b;
    if (updates && typeof updates === 'object' && 'id' in updates && updates.id !== id) {
      return b;
    }
    const next = { ...b, ...updates };
    if (next.type === 'heading' && 'level' in updates) {
      next.level = clampHeadingLevel(next.level);
    }
    if (next.type === 'list' && Array.isArray(updates.items)) {
      next.items = updates.items.map((x) => String(x));
    }
    if (next.type === 'callout' && updates.variant != null) {
      const v = updates.variant;
      next.variant =
        v === 'warning' || v === 'tip' || v === 'info' || v === 'important' ? v : b.variant || 'info';
    }
    if (next.type === 'table') {
      if (Array.isArray(updates.headers) || Array.isArray(updates.rows)) {
        const shaped = normalizeTableShape({
          headers: Array.isArray(updates.headers) ? updates.headers : next.headers,
          rows: Array.isArray(updates.rows) ? updates.rows : next.rows,
        });
        next.headers = shaped.headers;
        next.rows = shaped.rows;
      }
    }
    if (next.type === 'code' && updates.language != null) {
      next.language = String(updates.language).trim() || 'text';
    }
    return next;
  });
}

/**
 * Immutable delete: returns a new blocks array without the block with id.
 * @param {EditorBlock[]} blocks
 * @param {string} id
 * @returns {EditorBlock[]}
 */
export function deleteBlock(blocks, id) {
  if (!Array.isArray(blocks)) return [];
  return blocks.filter((b) => b && b.id !== id);
}

/**
 * @param {EditorBlock[]} blocks
 * @param {number} index — insert after this index
 * @param {EditorBlock} block
 * @returns {EditorBlock[]}
 */
export function insertBlockAfter(blocks, index, block) {
  if (!Array.isArray(blocks)) return [block];
  const next = [...blocks];
  const at = Math.min(Math.max(0, index + 1), next.length);
  next.splice(at, 0, block);
  return next;
}
