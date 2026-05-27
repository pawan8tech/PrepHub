/**
 * Topic body as { content: { heading: Block[] }, order }.
 * Each heading maps to an array of typed blocks: text, list, code, callout, table, image, group.
 * Legacy single values (string, {language,code}, etc.) are migrated on read via migrateHeadingValueToBlocks.
 */

const LEARNING_FIELDS = [
  { key: 'explanation', title: 'Description' },
  { key: 'whenToUse', title: 'When to Use' },
  { key: 'patternRecognition', title: 'Pattern Recognition' },
  { key: 'keyPoints', title: 'Key Points' },
  { key: 'examples', title: 'Examples' },
  { key: 'notes', title: 'Notes' },
];

const INTERVIEW_FIELDS = [
  { key: 'explanation', title: 'Description' },
  { key: 'importantPoints', title: 'Important Points' },
  { key: 'commonQuestions', title: 'Common Interview Questions' },
  { key: 'trickyPoints', title: 'Tricky / Confusing Points' },
];

function hasValue(v) {
  if (v == null) return false;
  if (typeof v === 'string') return v.length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return typeof v === 'object';
}

export function isCodeBlock(v) {
  return (
    v !== null &&
    typeof v === 'object' &&
    !Array.isArray(v) &&
    typeof v.code === 'string'
  );
}

export function isTableBlock(v) {
  return (
    v !== null &&
    typeof v === 'object' &&
    !Array.isArray(v) &&
    Array.isArray(v.headers) &&
    v.headers.length > 0
  );
}

const DEFAULT_TABLE_COLS = 2;
const DEFAULT_TABLE_ROWS = 2;

/** Coerce a row of either legacy shape (string[]) or new shape ({cells: string[]}) into a cell array. */
function rowToCells(r) {
  if (Array.isArray(r)) return r.map((c) => String(c));
  if (r && typeof r === 'object' && Array.isArray(r.cells)) return r.cells.map((c) => String(c));
  return [];
}

/**
 * Canonical table shape: `headers` is string[], `rows` is Array<{cells: string[]}>
 * where every row has exactly `headers.length` cells. Rows are objects (not arrays)
 * because Firestore forbids arrays-of-arrays. Pads short rows with '' and truncates
 * long rows. When `partial` lacks headers/rows, falls back to a 2x2 empty grid.
 * Accepts legacy string[][] input for backward compatibility.
 */
export function normalizeTableShape(partial) {
  const headersInput =
    partial && typeof partial === 'object' && Array.isArray(partial.headers) ? partial.headers : null;
  const rowsInput =
    partial && typeof partial === 'object' && Array.isArray(partial.rows) ? partial.rows : null;
  const headers = headersInput
    ? headersInput.map((h) => String(h))
    : Array.from({ length: DEFAULT_TABLE_COLS }, () => '');
  const colCount = headers.length;
  const rawRows =
    rowsInput
    ?? Array.from({ length: DEFAULT_TABLE_ROWS }, () =>
      Array.from({ length: colCount }, () => ''),
    );
  const rows = rawRows.map((r) => {
    const cells = rowToCells(r);
    let normCells;
    if (cells.length === colCount) normCells = cells;
    else if (cells.length < colCount) {
      normCells = [...cells, ...Array.from({ length: colCount - cells.length }, () => '')];
    } else {
      normCells = cells.slice(0, colCount);
    }
    return { cells: normCells };
  });
  return { headers, rows };
}

/** Stored as { type: "image", url: string, caption?: string } */
export function isImageBlock(v) {
  return (
    v !== null &&
    typeof v === 'object' &&
    !Array.isArray(v) &&
    v.type === 'image' &&
    typeof v.url === 'string'
  );
}

/** Stored as { type: "callout", variant: "info" | "warning" | "tip", content: string } */
export function isCalloutBlock(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v) && v.type === 'callout';
}

export const CALLOUT_VARIANTS = Object.freeze(['info', 'important', 'warning', 'tip']);

/** Nested sections stored as { content: { heading: value }, order: string[] } */
export function isOrderedDocument(v) {
  return (
    v !== null &&
    typeof v === 'object' &&
    !Array.isArray(v) &&
    typeof v.content === 'object' &&
    v.content !== null &&
    !Array.isArray(v.content) &&
    Array.isArray(v.order)
  );
}

/** Reserved content key: block array with no visible heading in view mode */
export const DOCUMENT_ROOT_KEY = '_root';

/** Typed blocks stored under each heading: [{ type, ... }, ...] */
export const HEADING_BLOCK_TYPES = new Set(['text', 'list', 'code', 'callout', 'table', 'image', 'group', 'qna']);

export function isStorageBlockShape(x) {
  return (
    x !== null &&
    typeof x === 'object' &&
    !Array.isArray(x) &&
    typeof x.type === 'string' &&
    HEADING_BLOCK_TYPES.has(x.type)
  );
}

export function isHeadingBlockArray(v) {
  return Array.isArray(v) && v.length > 0 && v.every((x) => isStorageBlockShape(x));
}

export function isPlainNestedObject(v) {
  return (
    v !== null &&
    typeof v === 'object' &&
    !Array.isArray(v) &&
    !isCodeBlock(v) &&
    !isTableBlock(v) &&
    !isImageBlock(v) &&
    !isCalloutBlock(v) &&
    !isOrderedDocument(v) &&
    !(typeof v.type === 'string' && HEADING_BLOCK_TYPES.has(v.type))
  );
}

/**
 * Normalize legacy flat { heading: value } into { content, order }.
 * Also accepts stored partials `{ content: { … } }` without `order`.
 */
export function ensureDocumentShape(raw) {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
    return { content: {}, order: [] };
  }
  /** Block-only notes: ignore legacy `content` / `order` so merges do not resurrect old structure. */
  if (Array.isArray(raw.blocks) && raw.blocks.length > 0) {
    return { content: {}, order: [], blocks: raw.blocks.slice() };
  }
  if (
    Array.isArray(raw.order) &&
    (typeof raw.content !== 'object' || raw.content === null || Array.isArray(raw.content))
  ) {
    return { content: {}, order: [...raw.order] };
  }
  if (isOrderedDocument(raw)) {
    const content = { ...raw.content };
    const order = [...raw.order];
    for (const k of Object.keys(content)) {
      if (!order.includes(k)) order.push(k);
    }
    return { content, order: reorderKeysWithRootFirst(order, Object.keys(content)) };
  }
  if (
    !isCodeBlock(raw) &&
    !isTableBlock(raw) &&
    !isImageBlock(raw) &&
    !isCalloutBlock(raw) &&
    typeof raw.content === 'object' &&
    raw.content !== null &&
    !Array.isArray(raw.content)
  ) {
    const content = { ...raw.content };
    const order = mergeOrderLists(
      Array.isArray(raw.order) ? [...raw.order] : [],
      Object.keys(content),
    );
    return { content, order: reorderKeysWithRootFirst(order, Object.keys(content)) };
  }
  const keys = Object.keys(raw);
  return { content: { ...raw }, order: reorderKeysWithRootFirst(keys, keys) };
}

export function mergeOrderLists(primary, allKeys) {
  const seen = new Set();
  const out = [];
  for (const k of primary) {
    if (allKeys.includes(k) && !seen.has(k)) {
      out.push(k);
      seen.add(k);
    }
  }
  for (const k of allKeys) {
    if (!seen.has(k)) {
      out.push(k);
      seen.add(k);
    }
  }
  return out;
}

/** Keep `_root` first in `order` when that key exists in the document. */
export function reorderKeysWithRootFirst(order, allContentKeys) {
  const list = [...order];
  if (!allContentKeys.includes(DOCUMENT_ROOT_KEY)) return list;
  const rest = list.filter((k) => k !== DOCUMENT_ROOT_KEY);
  return [DOCUMENT_ROOT_KEY, ...rest];
}

/** Keys to render sections in order (`_root` first when present). */
export function orderedDocumentSectionKeys(doc) {
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return [];
  const { content, order } = ensureDocumentShape(doc);
  const keys = order.filter((k) => Object.prototype.hasOwnProperty.call(content, k));
  const extra = Object.keys(content).filter((k) => !order.includes(k));
  return reorderKeysWithRootFirst([...keys, ...extra], Object.keys(content));
}

function cloneLeafStorageBlock(b) {
  if (!b || typeof b !== 'object') return { type: 'text', content: '' };
  switch (b.type) {
    case 'text':
      return { type: 'text', content: typeof b.content === 'string' ? b.content : '' };
    case 'list': {
      const items = Array.isArray(b.items) && b.items.length ? b.items.map((x) => String(x)) : [''];
      return { type: 'list', items };
    }
    case 'code':
      return {
        type: 'code',
        language: typeof b.language === 'string' && b.language.trim() ? b.language.trim() : 'text',
        content: typeof b.content === 'string' ? b.content : '',
      };
    case 'callout':
      return {
        type: 'callout',
        variant: CALLOUT_VARIANTS.includes(b.variant) ? b.variant : 'info',
        content: typeof b.content === 'string' ? b.content : '',
      };
    case 'table':
      return { type: 'table', ...normalizeTableShape(b) };
    case 'image':
      return {
        type: 'image',
        url: typeof b.url === 'string' ? b.url : '',
        caption: typeof b.caption === 'string' ? b.caption : '',
      };
    case 'qna': {
      const answerInput = Array.isArray(b.answer) ? b.answer : [];
      const answer = answerInput
        .map((child) => cloneLeafStorageBlock(child))
        .filter(Boolean);
      return {
        type: 'qna',
        question: typeof b.question === 'string' ? b.question : '',
        answer: answer.length > 0 ? answer : [{ type: 'text', content: '' }],
      };
    }
    default:
      return { type: 'text', content: '' };
  }
}

function normalizeOneStorageBlock(b) {
  if (!isStorageBlockShape(b)) return { type: 'text', content: '' };
  if (b.type === 'group') {
    const inner =
      b.content && typeof b.content === 'object'
        ? ensureDocumentShape(b.content)
        : { content: {}, order: [] };
    const nc = {};
    for (const k of Object.keys(inner.content)) {
      nc[k] = migrateHeadingValueToBlocks(inner.content[k]);
    }
    return { type: 'group', content: { content: nc, order: [...inner.order] } };
  }
  return cloneLeafStorageBlock(b);
}

/**
 * Legacy single value (string, list, code object, …) → array of typed blocks.
 * Idempotent when value is already a block array.
 */
export function migrateHeadingValueToBlocks(v) {
  if (v == null) return [{ type: 'text', content: '' }];
  if (Array.isArray(v) && v.length === 0) return [{ type: 'text', content: '' }];
  if (isHeadingBlockArray(v)) {
    return v.map((b) => normalizeOneStorageBlock(b));
  }
  if (Array.isArray(v)) {
    return [{ type: 'list', items: v.map((x) => String(x)) }];
  }
  if (typeof v === 'string') {
    return [{ type: 'text', content: v }];
  }
  if (isOrderedDocument(v)) {
    const nc = {};
    for (const key of Object.keys(v.content)) {
      nc[key] = migrateHeadingValueToBlocks(v.content[key]);
    }
    return [{ type: 'group', content: { content: nc, order: [...v.order] } }];
  }
  if (isPlainNestedObject(v)) {
    const shaped = ensureDocumentShape(v);
    const nc = {};
    for (const key of Object.keys(shaped.content)) {
      nc[key] = migrateHeadingValueToBlocks(shaped.content[key]);
    }
    return [{ type: 'group', content: { content: nc, order: [...shaped.order] } }];
  }
  if (isCodeBlock(v)) {
    return [{ type: 'code', language: v.language || 'text', content: v.code || '' }];
  }
  if (isImageBlock(v)) {
    return [
      {
        type: 'image',
        url: v.url || '',
        caption: typeof v.caption === 'string' ? v.caption : '',
      },
    ];
  }
  if (isCalloutBlock(v)) {
    return [
      {
        type: 'callout',
        variant: CALLOUT_VARIANTS.includes(v.variant) ? v.variant : 'info',
        content: typeof v.content === 'string' ? v.content : '',
      },
    ];
  }
  if (isTableBlock(v)) {
    return [{ type: 'table', ...normalizeTableShape(v) }];
  }
  return [{ type: 'text', content: String(v) }];
}

/** Every heading value in the tree becomes a block array (for merge, extract, editor). */
export function normalizeDocumentToBlockArrays(doc) {
  const shaped = ensureDocumentShape(doc || {});
  const { content, order, blocks } = shaped;
  const next = {};
  for (const k of Object.keys(content)) {
    next[k] = migrateHeadingValueToBlocks(content[k]);
  }
  const allKeys = Object.keys(next);
  const mergedOrder = mergeOrderLists(order, allKeys);
  const out = { content: next, order: reorderKeysWithRootFirst(mergedOrder, allKeys) };
  if (Array.isArray(blocks) && blocks.length > 0) {
    out.blocks = blocks.slice();
  }
  return out;
}

function mergeOrderedDocuments(bv, ov) {
  const mergedContent = deepMerge(
    { ...(bv && bv.content ? bv.content : {}) },
    ov && ov.content ? ov.content : {},
  );
  const mergedOrder = mergeOrderLists(
    ov && Array.isArray(ov.order) ? ov.order : [],
    Object.keys(mergedContent),
  );
  return {
    content: mergedContent,
    order: reorderKeysWithRootFirst(mergedOrder, Object.keys(mergedContent)),
  };
}

export function deepMerge(base, override) {
  if (override == null || typeof override !== 'object' || Array.isArray(override)) {
    return base ?? {};
  }
  const out = base && typeof base === 'object' && !Array.isArray(base) ? { ...base } : {};
  for (const k of Object.keys(override)) {
    const bv = out[k];
    const ov = override[k];
    if (isOrderedDocument(bv) && isOrderedDocument(ov)) {
      out[k] = mergeOrderedDocuments(bv, ov);
    } else if (isPlainNestedObject(bv) && isOrderedDocument(ov)) {
      out[k] = mergeOrderedDocuments(ensureDocumentShape(bv), ov);
    } else if (isOrderedDocument(bv) && isPlainNestedObject(ov)) {
      out[k] = mergeOrderedDocuments(bv, ensureDocumentShape(ov));
    } else if (isPlainNestedObject(bv) && isPlainNestedObject(ov)) {
      out[k] = deepMerge(bv, ov);
    } else {
      out[k] = ov;
    }
  }
  return out;
}

function flatToDocument(staticData, fields) {
  if (!staticData) return {};
  const doc = {};
  for (const { key, title } of fields) {
    const v = staticData[key];
    if (!hasValue(v)) continue;
    if (key === 'commonQuestions' && Array.isArray(v)) {
      doc[title] = v.map((item) => {
        if (typeof item === 'string') return item;
        const q = item?.q || '';
        const a = item?.a || '';
        return a ? `Q: ${q}\nA: ${a}` : `Q: ${q}`;
      });
    } else {
      doc[title] = v;
    }
  }
  return doc;
}

export function staticLearningToDocument(learning) {
  return flatToDocument(learning, LEARNING_FIELDS);
}

export function staticInterviewToDocument(interview) {
  return flatToDocument(interview, INTERVIEW_FIELDS);
}

function calloutToString(content) {
  const data = content || { variant: 'note', text: '' };
  const label = (data.variant || 'note').replace(/^./, (c) => c.toUpperCase());
  return data.text ? `${label}: ${data.text}` : '';
}

/** Migrate SectionRenderer-shaped section tree → heading map. */
export function sectionToDocumentNode(section) {
  if (!section || typeof section !== 'object') return {};

  const title = (section.title || 'Untitled').trim() || 'Untitled';

  switch (section.type) {
    case 'group': {
      const children = section.children || [];
      const nested = sectionsArrayToDocument(children);
      return { [title]: nested };
    }
    case 'text':
      return { [title]: typeof section.content === 'string' ? section.content : '' };
    case 'list':
    case 'steps':
      return { [title]: Array.isArray(section.content) ? section.content : [] };
    case 'code': {
      const c = section.content;
      const code = typeof c === 'string' ? c : c?.code || '';
      const language = typeof c === 'object' && c?.language ? c.language : 'text';
      return { [title]: { language, code } };
    }
    case 'callout':
      return { [title]: calloutToString(section.content) };
    case 'qa':
      return {
        [title]: Array.isArray(section.content)
          ? section.content.map((item) => {
            if (typeof item === 'string') return item;
            const q = item?.q || '';
            const a = item?.a || '';
            return a ? `Q: ${q}\nA: ${a}` : `Q: ${q}`;
          })
          : [],
      };
    case 'table':
      return { [title]: section.content && typeof section.content === 'object' ? section.content : { headers: [], rows: [] } };
    case 'image': {
      const c = section.content && typeof section.content === 'object' ? section.content : {};
      return {
        [title]: {
          type: 'image',
          url: typeof c.url === 'string' ? c.url : '',
          caption: typeof c.caption === 'string' ? c.caption : '',
        },
      };
    }
    default:
      return { [title]: typeof section.content === 'string' ? section.content : JSON.stringify(section.content ?? '') };
  }
}

export function sectionsArrayToDocument(sections) {
  if (!Array.isArray(sections)) return {};
  return sections.reduce((acc, s) => ({ ...acc, ...sectionToDocumentNode(s) }), {});
}

/** Merge static topic fields + user document + legacy sections (Firebase). */
export function getMergedDocument(modeData, userModeNotes, mode) {
  const staticFlat =
    mode === 'learning'
      ? staticLearningToDocument(modeData || {})
      : staticInterviewToDocument(modeData || {});
  const staticS = ensureDocumentShape(staticFlat);

  const userRaw =
    userModeNotes && typeof userModeNotes.document === 'object' && userModeNotes.document !== null
      ? userModeNotes.document
      : {};
  const userS = ensureDocumentShape(userRaw);

  let content = deepMerge({ ...staticS.content }, userS.content);
  let order = userS.order.length
    ? mergeOrderLists(userS.order, Object.keys(content))
    : mergeOrderLists(staticS.order, Object.keys(content));

  const merged = normalizeDocumentToBlockArrays({ content, order });
  if (Array.isArray(userS.blocks) && userS.blocks.length > 0) {
    return { ...merged, blocks: userS.blocks.slice() };
  }
  return merged;
}

function uniqueHeading(base, heading) {
  let h = (heading || '').trim() || 'Untitled';
  if (h === DOCUMENT_ROOT_KEY) {
    h = 'Untitled';
  }
  let n = 2;
  const baseHeading = h;
  while (Object.prototype.hasOwnProperty.call(base, h)) {
    h = `${baseHeading} (${n})`;
    n += 1;
  }
  return h;
}

/** Append AI extract (sections or legacy flat) into a document. */
export function appendAIDocument(existingDoc, aiPayload) {
  const { content: baseContent, order: baseOrder } = ensureDocumentShape(existingDoc || {});
  const base = { ...baseContent };
  const order = [...baseOrder];
  let incoming = {};

  if (Array.isArray(aiPayload?.sections) && aiPayload.sections.length > 0) {
    incoming = sectionsArrayToDocument(aiPayload.sections);
  } else if (typeof aiPayload?.summary === 'string' && aiPayload.summary.trim()) {
    incoming = {
      Summary: aiPayload.summary.trim(),
      ...(Array.isArray(aiPayload.keyPoints) && aiPayload.keyPoints.length
        ? { 'Key points': aiPayload.keyPoints.filter((x) => typeof x === 'string' && x.trim()) }
        : {}),
      ...(typeof aiPayload.important === 'string' && aiPayload.important.trim()
        ? { Important: `Warning: ${aiPayload.important.trim()}` }
        : {}),
      ...(Array.isArray(aiPayload.examples) && aiPayload.examples.length
        ? { Examples: aiPayload.examples.filter((x) => typeof x === 'string' && x.trim()) }
        : {}),
    };
  }

  if (!incoming || typeof incoming !== 'object' || Object.keys(incoming).length === 0) {
    const merged = mergeOrderLists(order, Object.keys(base));
    return { content: base, order: reorderKeysWithRootFirst(merged, Object.keys(base)) };
  }

  for (const [k, v] of Object.entries(incoming)) {
    const key = uniqueHeading(base, k);
    base[key] = v;
    if (!order.includes(key)) order.push(key);
  }
  const merged = mergeOrderLists(order, Object.keys(base));
  return { content: base, order: reorderKeysWithRootFirst(merged, Object.keys(base)) };
}

/** Structured editor: allowed section types (matches storage shapes). */
export const EDITOR_SECTION_TYPES = Object.freeze([
  'text',
  'list',
  'code',
  'callout',
  'table',
  'image',
  'group',
  'qna',
]);

export function newEditorBlockId() {
  return `blk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function storageBlockToEditorBlock(st) {
  const id = newEditorBlockId();
  if (!isStorageBlockShape(st)) {
    return { id, type: 'text', content: '' };
  }
  switch (st.type) {
    case 'text':
      return { id, type: 'text', content: typeof st.content === 'string' ? st.content : '' };
    case 'list': {
      const items = Array.isArray(st.items) && st.items.length ? st.items.map((x) => String(x)) : [''];
      return { id, type: 'list', items };
    }
    case 'code':
      return {
        id,
        type: 'code',
        language: typeof st.language === 'string' && st.language.trim() ? st.language.trim() : 'text',
        content: typeof st.content === 'string' ? st.content : '',
      };
    case 'callout':
      return {
        id,
        type: 'callout',
        variant: CALLOUT_VARIANTS.includes(st.variant) ? st.variant : 'info',
        content: typeof st.content === 'string' ? st.content : '',
      };
    case 'table':
      return { id, type: 'table', ...normalizeTableShape(st) };
    case 'image':
      return {
        id,
        type: 'image',
        url: typeof st.url === 'string' ? st.url : '',
        caption: typeof st.caption === 'string' ? st.caption : '',
      };
    case 'group': {
      const innerDoc =
        st.content && typeof st.content === 'object'
          ? normalizeDocumentToBlockArrays(st.content)
          : { content: {}, order: [] };
      return { id, type: 'group', children: documentToEditorBlocks(innerDoc) };
    }
    case 'qna': {
      const answerInput = Array.isArray(st.answer) ? st.answer : [];
      const answer =
        answerInput.length > 0
          ? answerInput.map((child) => storageBlockToEditorBlock(child))
          : [{ id: newEditorBlockId(), type: 'text', content: '' }];
      return {
        id,
        type: 'qna',
        question: typeof st.question === 'string' ? st.question : '',
        answer,
      };
    }
    default:
      return { id, type: 'text', content: '' };
  }
}

/** Top-level sections (each has heading + inner blocks). `_root` → `isRoot` section. Recursive for group.children. */
export function documentToEditorBlocks(doc) {
  const { content, order } = normalizeDocumentToBlockArrays(doc || {});
  return order
    .filter((k) => Object.prototype.hasOwnProperty.call(content, k))
    .map((k) =>
      k === DOCUMENT_ROOT_KEY
        ? {
            id: newEditorBlockId(),
            isRoot: true,
            heading: '',
            blocks: (content[k] || []).map((st) => storageBlockToEditorBlock(st)),
          }
        : {
            id: newEditorBlockId(),
            isRoot: false,
            heading: k,
            blocks: (content[k] || []).map((st) => storageBlockToEditorBlock(st)),
          },
    );
}

function editorInnerBlockToStorage(b) {
  switch (b.type) {
    case 'text':
      return { type: 'text', content: b.content ?? '' };
    case 'list': {
      const raw = (b.items || []).map((s) => String(s).trim());
      const items = raw.filter((s) => s.length > 0);
      return { type: 'list', items: items.length ? items : [''] };
    }
    case 'code':
      return {
        type: 'code',
        language: (b.language || 'text').trim() || 'text',
        content: b.content ?? '',
      };
    case 'callout':
      return {
        type: 'callout',
        variant: CALLOUT_VARIANTS.includes(b.variant) ? b.variant : 'info',
        content: b.content ?? '',
      };
    case 'table':
      return { type: 'table', ...normalizeTableShape(b) };
    case 'image':
      return {
        type: 'image',
        url: String(b.url ?? '').trim(),
        caption: String(b.caption ?? '').trim(),
      };
    case 'group':
      return { type: 'group', content: editorBlocksToDocument(b.children || []) };
    case 'qna': {
      const answerInput = Array.isArray(b.answer) ? b.answer : [];
      const answer = answerInput
        .map((child) => editorInnerBlockToStorage(child))
        .filter(Boolean);
      return {
        type: 'qna',
        question: typeof b.question === 'string' ? b.question : '',
        answer: answer.length > 0 ? answer : [{ type: 'text', content: '' }],
      };
    }
    default:
      return { type: 'text', content: '' };
  }
}

export function editorBlocksToDocument(sections) {
  if (!Array.isArray(sections) || sections.length === 0) return { content: {}, order: [] };
  const content = {};
  const order = [];
  let list = [...sections];
  const rootSections = list.filter((s) => s.isRoot);
  if (rootSections.length > 1) {
    const mergedBlocks = rootSections.flatMap((s) => s.blocks || []);
    const firstRootId = rootSections[0].id;
    list = list
      .map((s) =>
        s.isRoot && s.id === firstRootId ? { ...s, blocks: mergedBlocks } : s.isRoot ? null : s,
      )
      .filter(Boolean);
  }
  for (const sec of list) {
    if (sec.isRoot) {
      content[DOCUMENT_ROOT_KEY] = (sec.blocks || []).map((blk) => editorInnerBlockToStorage(blk));
      order.push(DOCUMENT_ROOT_KEY);
      continue;
    }
    const raw = (sec.heading || '').trim() || 'Untitled';
    const key = uniqueHeading(content, raw);
    content[key] = (sec.blocks || []).map((blk) => editorInnerBlockToStorage(blk));
    order.push(key);
  }
  return { content, order: reorderKeysWithRootFirst(order, Object.keys(content)) };
}

export function createEmptyInnerBlock(type = 'text') {
  const id = newEditorBlockId();
  switch (type) {
    case 'list':
      return { id, type: 'list', items: [''] };
    case 'code':
      return { id, type: 'code', language: 'text', content: '' };
    case 'callout':
      return { id, type: 'callout', variant: 'info', content: '' };
    case 'table':
      return { id, type: 'table', ...normalizeTableShape() };
    case 'image':
      return { id, type: 'image', url: '', caption: '' };
    case 'group':
      return { id, type: 'group', children: [] };
    default:
      return { id, type: 'text', content: '' };
  }
}

export function createEmptyEditorBlock() {
  return {
    id: newEditorBlockId(),
    isRoot: false,
    heading: 'New section',
    blocks: [createEmptyInnerBlock('text')],
  };
}

/** Top-level (or nested) intro row: maps to `content._root`, no visible heading in view mode. */
export function createEmptyRootEditorSection() {
  return {
    id: newEditorBlockId(),
    isRoot: true,
    heading: '',
    blocks: [createEmptyInnerBlock('text')],
  };
}

function innerBlockPlainTextForConvert(block) {
  if (block.type === 'text' || block.type === 'callout' || block.type === 'code') {
    return block.content ?? '';
  }
  if (block.type === 'list') return (block.items || []).join('\n');
  return '';
}

/** Change inner block type (under a heading); preserves `id`. */
export function applyInnerBlockTypeChange(block, newType) {
  const id = block.id;
  switch (newType) {
    case 'text': {
      const t = block.type;
      let body = '';
      if (t === 'list') body = (block.items || []).map((x) => String(x).trim()).filter(Boolean).join('\n');
      else body = innerBlockPlainTextForConvert(block);
      return { id, type: 'text', content: body };
    }
    case 'list': {
      let items = null;
      if (block.type === 'list') items = [...(block.items || [''])];
      else if (block.type === 'text' && block.content) {
        items = block.content.split(/\n+/).map((s) => s.trim()).filter(Boolean);
      } else if (block.type === 'code' && block.content) {
        items = block.content.split(/\n/).map((s) => s.trimEnd()).filter((s) => s.length > 0);
      } else if (block.type === 'callout' && block.content) {
        items = block.content.split(/\n+/).map((s) => s.trim()).filter(Boolean);
      }
      return { id, type: 'list', items: items?.length ? items : [''] };
    }
    case 'code': {
      let body = '';
      if (block.type === 'text') body = block.content ?? '';
      else if (block.type === 'list') body = (block.items || []).map((x) => String(x).trim()).filter(Boolean).join('\n');
      else if (block.type === 'callout') body = block.content ?? '';
      else body = block.content ?? '';
      const lang =
        block.type === 'code' ? (block.language || 'text').trim() || 'text' : 'text';
      return { id, type: 'code', language: lang, content: body };
    }
    case 'callout': {
      let body = '';
      if (block.type === 'text') body = block.content ?? '';
      else if (block.type === 'list') {
        body = (block.items || []).map((x) => String(x).trim()).filter(Boolean).join('\n');
      } else if (block.type === 'code') body = block.content ?? '';
      else body = block.content ?? '';
      const variant =
        block.type === 'callout' && CALLOUT_VARIANTS.includes(block.variant) ? block.variant : 'info';
      return { id, type: 'callout', variant, content: body };
    }
    case 'table':
      return { id, type: 'table', ...normalizeTableShape(block.type === 'table' ? block : undefined) };
    case 'image':
      return {
        id,
        type: 'image',
        url: block.type === 'image' ? (block.url ?? '') : '',
        caption: block.type === 'image' ? (block.caption ?? '') : '',
      };
    case 'group':
      return { id, type: 'group', children: [] };
    default:
      return { id, type: 'text', content: '' };
  }
}

/** @deprecated Use applyInnerBlockTypeChange — kept for existing imports */
export const applyEditorTypeChange = applyInnerBlockTypeChange;

/** Plain text from a flat editor/storage block list (heading + typed blocks). */
export function blocksToPlainText(blocks, maxDepth = 12) {
  if (!Array.isArray(blocks) || maxDepth < 0) return '';
  const parts = [];
  for (const b of blocks) {
    if (!b || typeof b !== 'object') continue;
    if (b.type === 'heading') {
      parts.push(String(b.content ?? ''));
      continue;
    }
    if (isStorageBlockShape(b)) {
      parts.push(plainTextFromStorageBlock(b, maxDepth));
    }
  }
  return parts.join(' ').trim();
}

function plainTextFromStorageBlock(b, maxDepth) {
  if (!b || typeof b !== 'object' || maxDepth < 0) return '';
  switch (b.type) {
    case 'text':
      return typeof b.content === 'string' ? b.content : '';
    case 'list':
      return (b.items || []).map((x) => String(x)).join(' ');
    case 'code':
      return `${b.language || ''} ${typeof b.content === 'string' ? b.content : ''}`;
    case 'callout':
      return typeof b.content === 'string' ? b.content : '';
    case 'table':
      return [...(b.headers || []), ...(b.rows || []).flatMap(rowToCells)].join(' ');
    case 'image':
      return [b.url, b.caption || ''].filter(Boolean).join(' ');
    case 'group':
      return documentToPlainText(ensureDocumentShape(b.content || {}), maxDepth - 1);
    case 'qna': {
      const q = typeof b.question === 'string' ? b.question : '';
      const answer = Array.isArray(b.answer) ? b.answer : [];
      const aText = answer
        .map((child) => plainTextFromStorageBlock(child, maxDepth - 1))
        .filter(Boolean)
        .join(' ');
      return [q, aText].filter(Boolean).join(' ');
    }
    default:
      return '';
  }
}

/** Collect searchable plain text from a document tree. */
export function documentToPlainText(doc, maxDepth = 12) {
  if (maxDepth < 0 || doc == null) return '';
  if (typeof doc === 'string') return doc;
  if (Array.isArray(doc)) {
    if (doc.length > 0 && isStorageBlockShape(doc[0])) {
      return doc.map((b) => plainTextFromStorageBlock(b, maxDepth)).join(' ');
    }
    return doc.map((x) => documentToPlainText(x, maxDepth - 1)).join(' ');
  }
  if (isCodeBlock(doc)) return `${doc.language || ''} ${doc.code}`;
  if (isTableBlock(doc)) {
    return [...(doc.headers || []), ...(doc.rows || []).flatMap(rowToCells)].join(' ');
  }
  if (isImageBlock(doc)) {
    return [doc.url, doc.caption || ''].filter(Boolean).join(' ');
  }
  if (isCalloutBlock(doc)) {
    return typeof doc.content === 'string' ? doc.content : '';
  }
  if (isOrderedDocument(doc)) {
    const shaped = ensureDocumentShape(doc);
    const { content, order } = shaped;
    const merged = mergeOrderLists(order, Object.keys(content));
    const keys = reorderKeysWithRootFirst(merged, Object.keys(content)).filter((k) =>
      Object.prototype.hasOwnProperty.call(content, k),
    );
    return keys.map((k) => documentToPlainText(content[k], maxDepth - 1)).join(' ');
  }
  if (typeof doc === 'object') {
    return Object.entries(doc)
      .map(([, v]) => documentToPlainText(v, maxDepth - 1))
      .join(' ');
  }
  return String(doc);
}
