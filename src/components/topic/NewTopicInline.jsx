import { useState } from 'react';
import { useNotes } from '../../context/NotesContext';
import { useTopicOrder } from '../../context/TopicOrderContext';
import { useAllContent } from '../../hooks/useAllContent';

function toSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const INTERVIEW_SEED = [
  { type: 'heading', level: 2, content: 'Description' },
  { type: 'text', content: '' },
  { type: 'heading', level: 2, content: 'Important Points' },
  { type: 'list', items: [''] },
];

/**
 * Inline "new topic" form revealed by the `/add topic` slash command.
 * Creates a topic in the same category as the note being edited and drops it
 * right after that topic in the list — no navigation.
 */
export default function NewTopicInline({ category, afterSlug, onClose, onCreated }) {
  const { createTopicNote } = useNotes();
  const { setOrder, applyOrder } = useTopicOrder();
  const { getTopicsByCategory } = useAllContent();
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setError('Title is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const slug = `custom-${toSlug(trimmed)}`;

      // Position the new topic right after the current one in this category.
      const ordered = applyOrder(category, getTopicsByCategory(category)).map((t) => t.slug);
      const next = ordered.filter((s) => s !== slug);
      const at = next.indexOf(afterSlug);
      if (at === -1) next.push(slug);
      else next.splice(at + 1, 0, slug);

      await createTopicNote({
        slug,
        title: trimmed,
        category,
        initialByMode: {
          learning: [{ type: 'text', content: '' }],
          interview: INTERVIEW_SEED,
        },
      });

      setOrder(category, next);
      onCreated?.(slug);
      onClose();
    } catch (err) {
      console.error('Failed to create topic:', err);
      setError('Failed to create topic. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-dashed border-primary-300 bg-primary-50/40 p-4 dark:border-primary-700 dark:bg-primary-950/20">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-surface-800 dark:text-surface-100">New topic</h3>
        <span className="text-[11px] text-surface-500 dark:text-surface-400">Added to this category</span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleCreate();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              onClose();
            }
          }}
          placeholder="Topic title"
          autoFocus
          disabled={saving}
          className="min-w-0 flex-1 rounded-md border border-surface-200 bg-white px-3 py-1.5 text-sm text-surface-800 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-100 disabled:opacity-50 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200"
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={saving || !title.trim()}
          className="rounded-lg border border-primary-300 bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50 dark:border-primary-600 dark:bg-primary-500 dark:hover:bg-primary-600"
        >
          {saving ? 'Adding…' : 'Add topic'}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-xs font-medium text-surface-700 transition-colors hover:bg-surface-50 disabled:opacity-50 dark:border-surface-600 dark:bg-surface-900 dark:text-surface-200 dark:hover:bg-surface-800"
        >
          Cancel
        </button>
      </div>
      {error ? <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}
