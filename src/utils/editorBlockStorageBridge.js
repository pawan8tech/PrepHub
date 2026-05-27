/**
 * Convert `_root` storage blocks ↔ draft blocks for inline block editing.
 * Headings are edited as `{ type: 'heading' }` but stored as markdown `text`.
 */

import { newEditorBlockId, isStorageBlockShape, normalizeTableShape } from './documentContent';
import { createBlock } from './editorBlockModel';

function stripId(b) {
  if (!b || typeof b !== 'object') return b;
  const { id: _id, ...rest } = b;
  return rest;
}

/**
 * @param {unknown[]} storageBlocks
 * @returns {Array<import('./editorBlockModel').EditorBlock | Record<string, unknown>>}
 */
export function storageRootToDraftBlocks(storageBlocks) {
  if (!Array.isArray(storageBlocks) || storageBlocks.length === 0) {
    return [createBlock('text')];
  }
  return storageBlocks.map((b) => storageBlockToDraft(b));
}

function storageBlockToDraft(b) {
  if (!isStorageBlockShape(b)) {
    return createBlock('text');
  }
  const id = newEditorBlockId();

  switch (b.type) {
    case 'text': {
      const c = typeof b.content === 'string' ? b.content : '';
      const lines = c.split('\n');
      const first = lines[0] || '';
      const hm = first.match(/^(#{1,6})\s+(.*)$/);
      if (hm && lines.length === 1) {
        return createBlock('heading', { id, level: hm[1].length, content: hm[2] });
      }
      return createBlock('text', { id, content: c });
    }
    case 'list': {
      const items = Array.isArray(b.items) && b.items.length ? b.items.map((x) => String(x)) : [''];
      return createBlock('list', { id, items });
    }
    case 'code':
      return createBlock('code', {
        id,
        content: typeof b.content === 'string' ? b.content : '',
        language: typeof b.language === 'string' && b.language.trim() ? b.language.trim() : 'text',
      });
    case 'callout':
      return createBlock('callout', {
        id,
        content: typeof b.content === 'string' ? b.content : '',
        variant:
          b.variant === 'warning' || b.variant === 'tip' || b.variant === 'info' || b.variant === 'important'
            ? b.variant
            : 'info',
      });
    case 'table':
      return { id, type: 'table', ...normalizeTableShape(b) };
    case 'qna': {
      const answerInput = Array.isArray(b.answer) ? b.answer : [];
      const answer =
        answerInput.length > 0
          ? answerInput.map((child) => storageBlockToDraft(child))
          : [createBlock('text')];
      return createBlock('qna', {
        id,
        question: typeof b.question === 'string' ? b.question : '',
        answer,
      });
    }
    case 'image':
    case 'group':
      return { ...JSON.parse(JSON.stringify(b)), id };
    default:
      return createBlock('text', { id });
  }
}

/**
 * @param {Array<import('./editorBlockModel').EditorBlock | Record<string, unknown>>} draftBlocks
 * @returns {Array<Record<string, unknown>>} storage-shaped blocks (no `id`)
 */
export function draftRootBlocksToStorage(draftBlocks) {
  if (!Array.isArray(draftBlocks) || draftBlocks.length === 0) {
    return [{ type: 'text', content: '' }];
  }
  return draftBlocks.map((b) => draftItemToStorage(b)).filter(Boolean);
}

function draftItemToStorage(b) {
  if (!b || typeof b !== 'object') return { type: 'text', content: '' };

  switch (b.type) {
    case 'heading': {
      const level = Math.min(6, Math.max(1, Number(b.level) || 2));
      const t = typeof b.content === 'string' ? b.content : '';
      return { type: 'text', content: t ? `${'#'.repeat(level)} ${t}` : `${'#'.repeat(level)} ` };
    }
    case 'text':
      return { type: 'text', content: typeof b.content === 'string' ? b.content : '' };
    case 'list': {
      const items = Array.isArray(b.items) ? b.items.map((x) => String(x)) : [''];
      const cleaned = items.map((s) => s.trim());
      return { type: 'list', items: cleaned.some((s) => s.length) ? cleaned : [''] };
    }
    case 'code':
      return {
        type: 'code',
        language: (typeof b.language === 'string' && b.language.trim()) || 'text',
        content: typeof b.content === 'string' ? b.content : '',
      };
    case 'callout': {
      const v = b.variant;
      const variant =
        v === 'warning' || v === 'tip' || v === 'info' || v === 'important' ? v : 'info';
      return {
        type: 'callout',
        variant,
        content: typeof b.content === 'string' ? b.content : '',
      };
    }
    case 'table':
      return { type: 'table', ...normalizeTableShape(b) };
    case 'qna': {
      const answerInput = Array.isArray(b.answer) ? b.answer : [];
      const answer = answerInput
        .map((child) => draftItemToStorage(child))
        .filter(Boolean);
      return {
        type: 'qna',
        question: typeof b.question === 'string' ? b.question : '',
        answer: answer.length > 0 ? answer : [{ type: 'text', content: '' }],
      };
    }
    case 'image':
    case 'group':
      return stripId(b);
    default:
      return { type: 'text', content: '' };
  }
}

export function isDraftPassthrough(b) {
  return b && typeof b === 'object' && (b.type === 'image' || b.type === 'group');
}
