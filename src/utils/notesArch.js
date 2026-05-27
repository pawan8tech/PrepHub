export const NOTE_MODES = ['learning', 'interview'];
const NOTE_MODE_SET = new Set(NOTE_MODES);
const MODE_SEPARATOR = '::';

export function noteBaseId(topicId, mode) {
  return `${topicId}${MODE_SEPARATOR}${mode}`;
}

export function parseBaseNoteId(baseId) {
  if (typeof baseId !== 'string' || !baseId.includes(MODE_SEPARATOR)) return null;
  const idx = baseId.lastIndexOf(MODE_SEPARATOR);
  const topicId = baseId.slice(0, idx);
  const mode = baseId.slice(idx + MODE_SEPARATOR.length);
  if (!topicId || !NOTE_MODE_SET.has(mode)) return null;
  return { topicId, mode };
}

export function userNoteFirestoreId(uid, baseId) {
  return `${uid}__${baseId}`;
}

/** Recover `topicSlug::mode` from a `user_notes` document id (`${uid}__${baseId}`). */
export function baseNoteIdFromUserNoteDocId(docId, uid) {
  if (typeof docId !== 'string' || typeof uid !== 'string' || !uid) return null;
  const prefix = `${uid}__`;
  if (!docId.startsWith(prefix)) return null;
  const baseId = docId.slice(prefix.length);
  return parseBaseNoteId(baseId) ? baseId : null;
}

export function cloneBlocks(blocks) {
  if (!Array.isArray(blocks)) return [];
  try {
    return JSON.parse(JSON.stringify(blocks));
  } catch {
    return [];
  }
}

export function documentToBlocks(document) {
  if (!document || typeof document !== 'object') return [];
  return cloneBlocks(document.blocks);
}

export function mergedContentModeBlocks(mergedContent, mode) {
  if (!mergedContent || typeof mergedContent !== 'object') return [];
  return cloneBlocks(mergedContent?.[mode]?.blocks);
}

function emptyTopicModes() {
  return {
    learning: { document: { blocks: [] }, sections: [] },
    interview: { document: { blocks: [] }, sections: [] },
    self: {},
  };
}

/**
 * Merge admin + user rows for block-only schema.
 * `user_rows` override `admin_rows` by matching `baseNoteId`.
 * @param {Array<{ id: string, blocks?: unknown[] } & Record<string, unknown>>} adminRows
 * @param {Array<{ baseNoteId?: string, blocks?: unknown[] } & Record<string, unknown>>} userRows
 * @returns {{ merged: Record<string, Record<string, unknown>>, sourceByBaseId: Record<string, 'admin' | 'user'> }}
 */
export function mergeAdminUserNoteLayers(adminRows, userRows) {
  const adminByBase = {};
  for (const row of adminRows) {
    if (typeof row?.id !== 'string') continue;
    adminByBase[row.id] = row;
  }

  const userByBase = {};
  for (const row of userRows) {
    let baseId = row?.baseNoteId;
    if (typeof baseId !== 'string' || !baseId) {
      const uid = typeof row?.userId === 'string' ? row.userId : '';
      baseId = baseNoteIdFromUserNoteDocId(row?.id, uid);
    }
    if (typeof baseId !== 'string' || !baseId) continue;
    userByBase[baseId] = row;
  }

  const baseIds = new Set([...Object.keys(adminByBase), ...Object.keys(userByBase)]);
  const merged = {};
  const sourceByBaseId = {};

  for (const baseId of baseIds) {
    const parsed = parseBaseNoteId(baseId);
    if (!parsed) continue;
    const picked = userByBase[baseId] || adminByBase[baseId];
    if (!picked) continue;
    const source = userByBase[baseId] ? 'user' : 'admin';
    sourceByBaseId[baseId] = source;

    const topicState = merged[parsed.topicId] || emptyTopicModes();
    topicState[parsed.mode] = {
      document: { blocks: cloneBlocks(picked.blocks) },
      sections: [],
    };
    merged[parsed.topicId] = topicState;
  }

  return { merged, sourceByBaseId };
}
