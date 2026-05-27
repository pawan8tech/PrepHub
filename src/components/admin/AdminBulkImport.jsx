import { useState, useMemo } from 'react';
import { createBlock } from '../../utils/editorBlockModel';
import { useNotes } from '../../context/NotesContext';

const VALID_TYPES = new Set(['text', 'heading', 'list', 'code', 'callout', 'table', 'qna']);
const SUPPORTED_MODES = ['learning', 'interview'];

function toSlug(title) {
  return String(title || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function normalizeBlockArray(input) {
  if (!Array.isArray(input)) return { blocks: [], skipped: 0 };
  let skipped = 0;
  const blocks = [];
  for (const raw of input) {
    if (!raw || typeof raw !== 'object' || !VALID_TYPES.has(raw.type)) {
      skipped += 1;
      continue;
    }
    const { id: _ignored, ...rest } = raw;
    blocks.push(createBlock(raw.type, rest));
  }
  return { blocks, skipped };
}

function readModeBlocks(slice) {
  if (slice == null) return { blocks: [], skipped: 0 };
  const arr = Array.isArray(slice)
    ? slice
    : Array.isArray(slice?.blocks)
    ? slice.blocks
    : null;
  if (arr == null) return { blocks: [], skipped: 0 };
  return normalizeBlockArray(arr);
}

function parsePayload(text, defaultCategory) {
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Expected a top-level object with a `topics` array.');
  }
  const topLevelCategory =
    typeof parsed.category === 'string' && parsed.category.trim()
      ? parsed.category.trim()
      : defaultCategory || '';
  if (!Array.isArray(parsed.topics) || parsed.topics.length === 0) {
    throw new Error('`topics` must be a non-empty array.');
  }

  const entries = [];
  let invalidEntries = 0;
  let totalSkippedBlocks = 0;

  for (const raw of parsed.topics) {
    if (!raw || typeof raw !== 'object') {
      invalidEntries += 1;
      continue;
    }
    const title = typeof raw.title === 'string' ? raw.title.trim() : '';
    if (!title) {
      invalidEntries += 1;
      continue;
    }
    const category =
      typeof raw.category === 'string' && raw.category.trim()
        ? raw.category.trim()
        : topLevelCategory;
    if (!category) {
      invalidEntries += 1;
      continue;
    }
    const slugRaw = typeof raw.slug === 'string' && raw.slug.trim() ? raw.slug.trim() : '';
    const slug = slugRaw || `custom-${toSlug(title)}`;
    if (!slug || slug === 'new') {
      invalidEntries += 1;
      continue;
    }

    const byMode = {};
    for (const mode of SUPPORTED_MODES) {
      const { blocks, skipped } = readModeBlocks(raw[mode]);
      totalSkippedBlocks += skipped;
      if (blocks.length > 0) byMode[mode] = blocks;
    }
    if (Object.keys(byMode).length === 0) {
      invalidEntries += 1;
      continue;
    }

    entries.push({ slug, title, category, byMode });
  }

  if (entries.length === 0) {
    throw new Error('No valid topic entries in the payload.');
  }

  return { entries, invalidEntries, totalSkippedBlocks };
}

export default function AdminBulkImport({ defaultCategory, onClose }) {
  const { notes, createTopicNote, updateModeDocument } = useNotes();
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const classification = useMemo(() => {
    if (!preview) return null;
    const toCreate = [];
    const toAppend = [];
    for (const entry of preview.entries) {
      if (notes[entry.slug]) toAppend.push(entry);
      else toCreate.push(entry);
    }
    return { toCreate, toAppend };
  }, [preview, notes]);

  function handleValidate() {
    setError('');
    setPreview(null);
    setResult(null);
    if (!text.trim()) {
      setError('Paste some JSON first.');
      return;
    }
    try {
      setPreview(parsePayload(text, defaultCategory));
    } catch (err) {
      setError(err instanceof SyntaxError ? `Invalid JSON: ${err.message}` : err.message);
    }
  }

  async function handleImport() {
    if (!preview || !classification) return;
    setImporting(true);
    setError('');
    const created = [];
    const appended = [];
    const failed = [];

    for (const entry of preview.entries) {
      try {
        if (notes[entry.slug]) {
          const existing = notes[entry.slug] || {};
          for (const mode of SUPPORTED_MODES) {
            const incoming = entry.byMode[mode];
            if (!Array.isArray(incoming) || incoming.length === 0) continue;
            const current = Array.isArray(existing?.[mode]?.document?.blocks)
              ? existing[mode].document.blocks
              : [];
            await updateModeDocument(entry.slug, mode, {
              blocks: [...current, ...incoming],
            });
          }
          appended.push(entry.slug);
        } else {
          await createTopicNote({
            slug: entry.slug,
            title: entry.title,
            category: entry.category,
            initialByMode: {
              learning: entry.byMode.learning || [],
              interview: entry.byMode.interview || [],
            },
          });
          created.push(entry.slug);
        }
      } catch (err) {
        console.error('Bulk import: failed for', entry.slug, err);
        failed.push({ slug: entry.slug, message: err?.message || 'Unknown error' });
      }
    }

    setResult({ created, appended, failed });
    setImporting(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-2xl rounded-xl border border-surface-200 bg-white shadow-xl dark:border-surface-700 dark:bg-surface-900">
        <div className="flex items-center justify-between gap-2 border-b border-surface-100 px-4 py-3 dark:border-surface-800">
          <h2 className="text-sm font-semibold text-surface-800 dark:text-surface-100">
            Bulk import topics from JSON
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-lg leading-none text-surface-400 transition hover:bg-surface-100 hover:text-surface-700 dark:hover:bg-surface-800 dark:hover:text-surface-200"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-3 px-4 pb-4 pt-3">
          <p className="text-xs text-surface-500 dark:text-surface-400">
            Top-level shape:
            <code className="mx-1 rounded bg-surface-100 px-1 py-0.5 text-[11px] dark:bg-surface-800">
              {`{ "category": "...", "topics": [ { "title": "...", "learning": {...}, "interview": {...} } ] }`}
            </code>
            New slugs become topics; existing slugs get their blocks appended to each mode (nothing is overwritten).
            Default category for this page:{' '}
            <strong>{defaultCategory || '(none)'}</strong>.
          </p>

          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (preview) setPreview(null);
              if (error) setError('');
              if (result) setResult(null);
            }}
            rows={12}
            spellCheck={false}
            placeholder='{ "category": "react", "topics": [ { "title": "Closures", "learning": { "blocks": [...] }, "interview": { "blocks": [...] } } ] }'
            className="w-full resize-none rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 font-mono text-xs text-surface-800 placeholder-surface-400 outline-none transition focus:border-primary-400 focus:ring-1 focus:ring-primary-400 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 dark:placeholder-surface-500"
          />

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          ) : null}

          {preview && classification && !result ? (
            <div className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-xs text-surface-700 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-200">
              <div className="mb-1 font-semibold">Preview:</div>
              <ul className="list-disc pl-5">
                <li>
                  <strong>{classification.toCreate.length}</strong> new topic
                  {classification.toCreate.length === 1 ? '' : 's'} will be created
                  {classification.toCreate.length > 0 ? (
                    <span className="text-surface-500 dark:text-surface-400">
                      {' '}({classification.toCreate.slice(0, 5).map((e) => e.slug).join(', ')}
                      {classification.toCreate.length > 5 ? ', …' : ''})
                    </span>
                  ) : null}
                </li>
                <li>
                  <strong>{classification.toAppend.length}</strong> existing topic
                  {classification.toAppend.length === 1 ? '' : 's'} will have blocks appended
                  {classification.toAppend.length > 0 ? (
                    <span className="text-surface-500 dark:text-surface-400">
                      {' '}({classification.toAppend.slice(0, 5).map((e) => e.slug).join(', ')}
                      {classification.toAppend.length > 5 ? ', …' : ''})
                    </span>
                  ) : null}
                </li>
                {preview.invalidEntries > 0 ? (
                  <li className="text-amber-600 dark:text-amber-400">
                    Skipped {preview.invalidEntries} invalid topic
                    {preview.invalidEntries === 1 ? '' : 's'} (missing title / category / blocks)
                  </li>
                ) : null}
                {preview.totalSkippedBlocks > 0 ? (
                  <li className="text-amber-600 dark:text-amber-400">
                    Skipped {preview.totalSkippedBlocks} invalid block
                    {preview.totalSkippedBlocks === 1 ? '' : 's'} (unknown type or wrong shape)
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}

          {result ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-900/20 dark:text-emerald-200">
              <div className="mb-1 font-semibold">Import complete.</div>
              <ul className="list-disc pl-5">
                <li>
                  <strong>{result.created.length}</strong> created
                </li>
                <li>
                  <strong>{result.appended.length}</strong> appended
                </li>
                {result.failed.length > 0 ? (
                  <li className="text-red-600 dark:text-red-400">
                    {result.failed.length} failed:{' '}
                    {result.failed.map((f) => f.slug).join(', ')}
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            {!preview && !result ? (
              <button
                type="button"
                onClick={handleValidate}
                disabled={!text.trim()}
                className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Validate
              </button>
            ) : null}
            {preview && !result ? (
              <>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={importing}
                  className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {importing ? 'Importing…' : 'Import all'}
                </button>
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="rounded-lg px-3 py-2 text-sm text-surface-500 transition hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200"
                >
                  Edit JSON
                </button>
              </>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="ml-auto rounded-lg px-3 py-2 text-sm text-surface-500 transition hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200"
            >
              {result ? 'Done' : 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
