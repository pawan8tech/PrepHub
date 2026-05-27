import {
  DOCUMENT_ROOT_KEY,
  ensureDocumentShape,
  getMergedDocument,
  normalizeDocumentToBlockArrays,
  orderedDocumentSectionKeys,
} from './documentContent';
import { storageRootToDraftBlocks } from './editorBlockStorageBridge';
import { createBlock } from './editorBlockModel';

/**
 * Convert legacy topic document shape into a single flat array of draft blocks (each with `id`).
 * Does not mutate `oldContent`.
 *
 * Walks `content` in document order. For every section key except `_root`, inserts a heading block
 * (level 2, content = key) then the section’s blocks. `_root` contributes only its blocks.
 * Legacy values (string, string[], code object, typed blocks, …) are normalized via `migrateHeadingValueToBlocks`
 * before mapping to draft blocks.
 *
 * @param {unknown} oldContent — same shapes accepted by `ensureDocumentShape` (e.g. `{ content, order }` or flat heading map)
 * @returns {Array<import('./editorBlockModel').EditorBlock | Record<string, unknown>>}
 */
export function transformToBlocks(oldContent) {
  const { content, order } = normalizeDocumentToBlockArrays(ensureDocumentShape(oldContent ?? {}));
  const keys = orderedDocumentSectionKeys({ content, order });
  if (keys.length === 0) {
    return [];
  }

  const out = [];
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(content, key)) continue;
    const sectionBlocks = Array.isArray(content[key]) ? content[key] : [];

    if (key !== DOCUMENT_ROOT_KEY) {
      out.push(createBlock('heading', { level: 2, content: key }));
    }
    out.push(...storageRootToDraftBlocks(sectionBlocks));
  }

  return out;
}

/**
 * Single source of truth for topic mode notes as a flat block array.
 * User `document.blocks` → else static `modeData.blocks` → else legacy merged document via `transformToBlocks`.
 * @param {Record<string, unknown>} modeData — `topic.content.learning` or `.interview` slice
 * @param {Record<string, unknown>} [userNotesMode] — `{ document?, sections? }`
 * @param {'learning' | 'interview'} mode
 * @returns {unknown[]}
 */
export function getMergedModeBlocks(modeData, userNotesMode, mode) {
  const fromUser = userNotesMode?.document?.blocks;
  if (Array.isArray(fromUser) && fromUser.length > 0) {
    return fromUser.slice();
  }
  if (modeData && Array.isArray(modeData.blocks) && modeData.blocks.length > 0) {
    return modeData.blocks.slice();
  }
  const legacy = getMergedDocument(modeData || {}, userNotesMode, mode);
  const keys = orderedDocumentSectionKeys(ensureDocumentShape(legacy));
  if (keys.length === 0 && !(Array.isArray(legacy.blocks) && legacy.blocks.length > 0)) {
    return [];
  }
  if (keys.length === 0 && Array.isArray(legacy.blocks) && legacy.blocks.length > 0) {
    return legacy.blocks.slice();
  }
  return transformToBlocks(legacy);
}
