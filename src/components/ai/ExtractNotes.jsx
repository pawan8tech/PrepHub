import { useState, useRef, useEffect } from 'react';
import { extractNotes } from '../../services/ai';
import { BlockSequenceView } from '../topic/TopicDocument';

/**
 * AI extract panel. Parent controls visibility; pass onClose to dismiss (✕ / Cancel / after insert).
 */
export default function ExtractNotes({ onInsert, onClose, panelRef }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState(null);
  const fallbackRef = useRef(null);
  const containerRef = panelRef ?? fallbackRef;

  useEffect(() => {
    containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);

  const previewBlocks = Array.isArray(notes?.blocks) ? notes.blocks : [];

  async function handleExtract() {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setNotes(null);
    try {
      const result = await extractNotes(text.trim());
      setNotes(result);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  function handleInsert() {
    if (!notes) return;
    onInsert(notes);
    setText('');
    setNotes(null);
    onClose?.();
  }

  function handleCancel() {
    setText('');
    setNotes(null);
    setError(null);
    onClose?.();
  }

  return (
    <div ref={containerRef} className="rounded-xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900">
      <div className="flex items-center justify-between gap-2 border-b border-surface-100 px-4 py-3 dark:border-surface-800">
        <span className="flex items-center gap-2 text-sm font-semibold text-surface-800 dark:text-surface-100">
          <SparkleIcon />
          Extract Notes
        </span>
        <button
          type="button"
          onClick={handleCancel}
          className="rounded-md p-1 text-lg leading-none text-surface-400 transition hover:bg-surface-100 hover:text-surface-700 dark:hover:bg-surface-800 dark:hover:text-surface-200"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="flex flex-col gap-4 px-4 pb-4 pt-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste a paragraph — AI will convert it into structured notes..."
          rows={4}
          className="w-full resize-none rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-800 placeholder-surface-400 outline-none transition focus:border-primary-400 focus:ring-1 focus:ring-primary-400 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 dark:placeholder-surface-500"
        />

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExtract}
            disabled={loading || !text.trim()}
            className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Extracting...
              </>
            ) : (
              'Run extract'
            )}
          </button>
          {(notes || error) && (
            <button
              type="button"
              onClick={() => {
                setText('');
                setNotes(null);
                setError(null);
              }}
              className="rounded-lg px-3 py-2 text-sm text-surface-400 transition hover:text-surface-600 dark:text-surface-500 dark:hover:text-surface-300"
            >
              Clear
            </button>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {notes && (
          <div className="flex flex-col gap-4 pt-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-surface-400 dark:text-surface-500">
              Preview
            </p>

            {notes.title && (
              <h4 className="text-base font-semibold text-surface-800 dark:text-surface-100">{notes.title}</h4>
            )}

            {previewBlocks.length > 0 ? (
              <BlockSequenceView blocks={previewBlocks} depth={0} />
            ) : (
              <p className="text-sm text-surface-500 dark:text-surface-400">Nothing to preview.</p>
            )}

            <div className="flex flex-wrap items-center gap-2 border-t border-surface-200 pt-4 dark:border-surface-700">
              <button
                type="button"
                onClick={handleInsert}
                disabled={previewBlocks.length === 0}
                className="flex items-center gap-1.5 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <PlusIcon />
                Insert into Topic
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-lg px-4 py-2 text-sm font-medium text-surface-500 transition hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SparkleIcon() {
  return (
    <svg className="h-4 w-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}
