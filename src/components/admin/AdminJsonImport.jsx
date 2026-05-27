import { useState } from 'react';
import { createBlock } from '../../utils/editorBlockModel';

const VALID_TYPES = new Set(['text', 'heading', 'list', 'code', 'callout', 'table', 'qna']);
const SUPPORTED_MODES = ['learning', 'interview'];

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

function parseImportJson(text, currentMode) {
  const parsed = JSON.parse(text);

  if (Array.isArray(parsed)) {
    const { blocks, skipped } = normalizeBlockArray(parsed);
    return { byMode: { [currentMode]: blocks }, skipped };
  }

  if (parsed && typeof parsed === 'object') {
    const byMode = {};
    let skipped = 0;
    for (const mode of SUPPORTED_MODES) {
      const slice = parsed[mode];
      if (slice == null) continue;
      const arr = Array.isArray(slice)
        ? slice
        : Array.isArray(slice?.blocks)
        ? slice.blocks
        : null;
      if (arr == null) continue;
      const res = normalizeBlockArray(arr);
      byMode[mode] = res.blocks;
      skipped += res.skipped;
    }
    if (Object.keys(byMode).length === 0) {
      throw new Error('Expected an array of blocks, or an object with `learning` / `interview` keys.');
    }
    return { byMode, skipped };
  }

  throw new Error('Expected an array of blocks, or an object with `learning` / `interview` keys.');
}

export default function AdminJsonImport({ currentMode, onAppend, onClose }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);

  function handleValidate() {
    setError('');
    setPreview(null);
    if (!text.trim()) {
      setError('Paste some JSON first.');
      return;
    }
    try {
      const res = parseImportJson(text, currentMode);
      const total = Object.values(res.byMode).reduce((n, arr) => n + arr.length, 0);
      if (total === 0) {
        setError('No valid blocks found in JSON.');
        return;
      }
      setPreview(res);
    } catch (err) {
      setError(err instanceof SyntaxError ? `Invalid JSON: ${err.message}` : err.message);
    }
  }

  async function handleAppend() {
    if (!preview) return;
    setImporting(true);
    setError('');
    try {
      await onAppend(preview.byMode);
      onClose?.();
    } catch (err) {
      setError(err?.message || 'Failed to append notes.');
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-2xl rounded-xl border border-surface-200 bg-white shadow-xl dark:border-surface-700 dark:bg-surface-900">
        <div className="flex items-center justify-between gap-2 border-b border-surface-100 px-4 py-3 dark:border-surface-800">
          <h2 className="text-sm font-semibold text-surface-800 dark:text-surface-100">
            Import notes from JSON
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
            Paste a JSON array of blocks (appends to <strong>{currentMode}</strong>), or an object
            with{' '}
            <code className="mx-1 rounded bg-surface-100 px-1 py-0.5 text-[11px] dark:bg-surface-800">
              learning
            </code>{' '}
            /
            <code className="mx-1 rounded bg-surface-100 px-1 py-0.5 text-[11px] dark:bg-surface-800">
              interview
            </code>{' '}
            keys to append to both. Allowed block types: text, heading, list, code, callout, table, qna.
          </p>

          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (preview) setPreview(null);
              if (error) setError('');
            }}
            rows={10}
            spellCheck={false}
            placeholder='[{"type":"heading","level":2,"content":"Overview"},{"type":"text","content":"..."}]'
            className="w-full resize-none rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 font-mono text-xs text-surface-800 placeholder-surface-400 outline-none transition focus:border-primary-400 focus:ring-1 focus:ring-primary-400 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 dark:placeholder-surface-500"
          />

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          ) : null}

          {preview ? (
            <div className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-xs text-surface-700 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-200">
              <div className="mb-1 font-semibold">Will append:</div>
              <ul className="list-disc pl-5">
                {Object.entries(preview.byMode).map(([mode, blocks]) => (
                  <li key={mode}>
                    <strong>{mode}:</strong> {blocks.length} block{blocks.length === 1 ? '' : 's'}
                  </li>
                ))}
              </ul>
              {preview.skipped > 0 ? (
                <div className="mt-1 text-amber-600 dark:text-amber-400">
                  Skipped {preview.skipped} invalid block{preview.skipped === 1 ? '' : 's'} (unknown
                  type or wrong shape).
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            {!preview ? (
              <button
                type="button"
                onClick={handleValidate}
                disabled={!text.trim()}
                className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Validate
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleAppend}
                  disabled={importing}
                  className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {importing ? 'Appending…' : 'Append'}
                </button>
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="rounded-lg px-3 py-2 text-sm text-surface-500 transition hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200"
                >
                  Edit JSON
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="ml-auto rounded-lg px-3 py-2 text-sm text-surface-500 transition hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
