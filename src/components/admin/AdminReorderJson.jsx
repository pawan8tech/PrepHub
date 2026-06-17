import { useState, useMemo, useCallback } from 'react';
import { useAllContent } from '../../hooks/useAllContent';
import { useTopicOrder } from '../../context/TopicOrderContext';

/**
 * AdminReorderJson
 *
 * A single JSON input that sets the topic order in bulk. The admin pastes an
 * ordered list of topic slugs and the order is saved to the shared admin doc,
 * which becomes the default order for every user who hasn't reordered that
 * category themselves.
 *
 * Two accepted JSON shapes:
 *   1. An array of slugs for the current category:
 *        ["closures", "hoisting", "promises"]
 *   2. An object mapping category slug -> ordered slugs (multiple categories):
 *        { "javascript": ["closures", "hoisting"], "react": ["hooks", "jsx"] }
 *
 * Unknown slugs are dropped; known topics omitted from the list are appended
 * at the end in their existing order (handled by applyOrder on read).
 */
export default function AdminReorderJson({ defaultCategory, onClose }) {
  const { getTopicsByCategory } = useAllContent();
  const { setOrder, applyOrder } = useTopicOrder();

  // Prefill the textarea with the current order of the active category so the
  // admin edits an existing list instead of typing slugs from scratch.
  const initialJson = useMemo(() => {
    const raw = getTopicsByCategory(defaultCategory) || [];
    const ordered = applyOrder(defaultCategory, raw);
    return JSON.stringify(ordered.map((t) => t.slug), null, 2);
  }, [defaultCategory, getTopicsByCategory, applyOrder]);

  const [text, setText] = useState(initialJson);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);

  // Build { categorySlug: orderedSlugs } from whichever shape was pasted.
  const parsePayload = useCallback(
    (input) => {
      const parsed = JSON.parse(input);
      let byCategory;
      if (Array.isArray(parsed)) {
        byCategory = { [defaultCategory]: parsed };
      } else if (parsed && typeof parsed === 'object') {
        byCategory = parsed;
      } else {
        throw new Error('Expected a JSON array of slugs or an object of category → slugs.');
      }

      const plan = [];
      for (const [categorySlug, slugs] of Object.entries(byCategory)) {
        if (!Array.isArray(slugs)) {
          throw new Error(`"${categorySlug}" must map to an array of topic slugs.`);
        }
        const known = new Set((getTopicsByCategory(categorySlug) || []).map((t) => t.slug));
        if (known.size === 0) {
          throw new Error(`No topics found for category "${categorySlug}".`);
        }
        const seen = new Set();
        const valid = [];
        const unknown = [];
        for (const s of slugs) {
          if (typeof s !== 'string') continue;
          const slug = s.trim();
          if (!slug || seen.has(slug)) continue;
          seen.add(slug);
          if (known.has(slug)) valid.push(slug);
          else unknown.push(slug);
        }
        if (valid.length === 0) {
          throw new Error(`None of the slugs for "${categorySlug}" match existing topics.`);
        }
        const appended = known.size - valid.length;
        plan.push({ categorySlug, valid, unknown, appended });
      }
      return plan;
    },
    [defaultCategory, getTopicsByCategory],
  );

  const handleApply = useCallback(async () => {
    setError('');
    setResult(null);
    let plan;
    try {
      plan = parsePayload(text);
    } catch (err) {
      setError(err instanceof SyntaxError ? `Invalid JSON: ${err.message}` : err.message);
      return;
    }
    setSaving(true);
    try {
      for (const { categorySlug, valid } of plan) {
        await setOrder(categorySlug, valid);
      }
      setResult(plan);
    } catch (err) {
      setError(`Failed to save order: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }, [text, parsePayload, setOrder]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-xl dark:bg-surface-900">
        <div className="flex items-center justify-between border-b border-surface-200 px-5 py-4 dark:border-surface-700">
          <div>
            <h2 className="text-base font-bold text-surface-900 dark:text-white">
              Reorder topics from JSON
            </h2>
            <p className="mt-0.5 text-xs text-surface-500 dark:text-surface-400">
              Sets the default order for all users who haven&apos;t reordered themselves.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-surface-400 hover:bg-surface-100 hover:text-surface-700 dark:hover:bg-surface-800 dark:hover:text-surface-200"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="mb-2 text-xs text-surface-500 dark:text-surface-400">
            Paste an array of slugs for <span className="font-medium text-surface-700 dark:text-surface-300">{defaultCategory}</span>,
            or an object mapping category → ordered slugs for several categories.
          </p>
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setError('');
              setResult(null);
            }}
            spellCheck={false}
            rows={12}
            className="w-full resize-y rounded-lg border border-surface-200 bg-surface-50 p-3 font-mono text-xs text-surface-800 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:border-surface-700 dark:bg-surface-950 dark:text-surface-200 dark:focus:border-primary-600 dark:focus:ring-primary-900/30"
          />

          {error && (
            <div className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-3 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
              <p className="font-medium">Order saved.</p>
              <ul className="mt-1 space-y-0.5">
                {result.map((r) => (
                  <li key={r.categorySlug}>
                    <span className="font-medium">{r.categorySlug}</span>: {r.valid.length} ordered
                    {r.appended > 0 && `, ${r.appended} kept at end`}
                    {r.unknown.length > 0 && `, ${r.unknown.length} unknown slug(s) ignored`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-surface-200 px-5 py-3 dark:border-surface-700">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-surface-600 hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-surface-800"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {saving && (
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {saving ? 'Saving...' : 'Apply order'}
          </button>
        </div>
      </div>
    </div>
  );
}
