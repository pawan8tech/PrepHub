import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAllCategories } from '../hooks/useAllCategories';
import { useAllContent } from '../hooks/useAllContent';
import { useCustomCategories } from '../context/CustomCategoriesContext';
import { useNotes } from '../context/NotesContext';
import { useAuth } from '../context/AuthContext';

export default function Categories() {
  const { allCategories } = useAllCategories();
  const { getTopicsByCategory } = useAllContent();
  const { addCategory, updateCategory, deleteCategory } = useCustomCategories();
  const { deleteTopic } = useNotes();
  const { user } = useAuth();

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Category name is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await addCategory(trimmed);
      setName('');
      setAdding(false);
    } catch (err) {
      console.error('Failed to create category:', err);
      setError('Failed to create category. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (cat) => {
    const topics = getTopicsByCategory(cat.slug);
    const count = topics.length;
    const msg =
      count > 0
        ? `Delete "${cat.title}" and its ${count} topic${count === 1 ? '' : 's'}? This can't be undone.`
        : `Delete "${cat.title}"?`;
    if (!window.confirm(msg)) return;
    try {
      for (const t of topics) {
        // eslint-disable-next-line no-await-in-loop
        await deleteTopic(t.slug);
      }
      await deleteCategory(cat.slug);
    } catch (err) {
      console.error('Failed to delete category:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-white">
            All Categories
          </h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            Browse topics organized by technology and subject area.
          </p>
        </div>

        {user && !adding && (
          <button
            type="button"
            onClick={() => {
              setError('');
              setAdding(true);
            }}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-primary-300 bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-700 dark:border-primary-600 dark:bg-primary-500 dark:hover:bg-primary-600"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New category
          </button>
        )}
      </div>

      {user && adding && (
        <div className="rounded-xl border border-dashed border-primary-300 bg-primary-50/40 p-4 dark:border-primary-700 dark:bg-primary-950/20">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAdd();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  setAdding(false);
                  setName('');
                }
              }}
              placeholder="Category name"
              autoFocus
              disabled={saving}
              className="min-w-0 flex-1 rounded-md border border-surface-200 bg-white px-3 py-1.5 text-sm text-surface-800 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-100 disabled:opacity-50 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200"
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={saving || !name.trim()}
              className="rounded-lg border border-primary-300 bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50 dark:border-primary-600 dark:bg-primary-500 dark:hover:bg-primary-600"
            >
              {saving ? 'Adding…' : 'Add'}
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setName('');
                setError('');
              }}
              disabled={saving}
              className="rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-xs font-medium text-surface-700 transition-colors hover:bg-surface-50 disabled:opacity-50 dark:border-surface-600 dark:bg-surface-900 dark:text-surface-200 dark:hover:bg-surface-800"
            >
              Cancel
            </button>
          </div>
          {error ? <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p> : null}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {allCategories.map((cat) => (
          <CategoryCard
            key={cat.slug}
            cat={cat}
            canManage={Boolean(user) && Boolean(cat.isCustom)}
            onRename={(title) => updateCategory(cat.slug, title)}
            onDelete={() => handleDeleteCategory(cat)}
          />
        ))}
      </div>
    </div>
  );
}

function CategoryCard({ cat, canManage, onRename, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(cat.title);
  const [busy, setBusy] = useState(false);

  const saveRename = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === cat.title) {
      setEditing(false);
      setName(cat.title);
      return;
    }
    setBusy(true);
    try {
      await onRename(trimmed);
      setEditing(false);
    } catch (err) {
      console.error('Failed to rename category:', err);
    } finally {
      setBusy(false);
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-dashed border-primary-300 bg-primary-50/40 p-4 dark:border-primary-700 dark:bg-primary-950/20">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              saveRename();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              setEditing(false);
              setName(cat.title);
            }
          }}
          autoFocus
          disabled={busy}
          className="min-w-0 flex-1 rounded-md border border-surface-200 bg-white px-3 py-1.5 text-sm text-surface-800 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-100 disabled:opacity-50 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200"
        />
        <button
          type="button"
          onClick={saveRename}
          disabled={busy || !name.trim()}
          className="shrink-0 rounded-lg border border-primary-300 bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50 dark:border-primary-600 dark:bg-primary-500 dark:hover:bg-primary-600"
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setName(cat.title);
          }}
          disabled={busy}
          className="shrink-0 rounded-lg px-2 py-1.5 text-xs font-medium text-surface-500 transition-colors hover:text-surface-700 disabled:opacity-50 dark:text-surface-400 dark:hover:text-surface-200"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="group relative">
      <Link
        to={cat.slug === 'dsa' ? '/dsa' : `/category/${cat.slug}`}
        className="flex items-start gap-4 rounded-xl border border-surface-200 bg-white p-5 transition-all hover:border-surface-300 hover:shadow-md dark:border-surface-800 dark:bg-surface-900 dark:hover:border-surface-700"
      >
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-2xl"
          style={{ backgroundColor: `${cat.color}15` }}
        >
          {cat.icon}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-surface-800 group-hover:text-primary-600 dark:text-surface-200 dark:group-hover:text-primary-400">
              {cat.title}
            </h3>
            {cat.isCustom && (
              <span className="rounded bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-600 dark:bg-violet-900/25 dark:text-violet-400">
                Custom
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400 line-clamp-2">
            {cat.description}
          </p>
        </div>
      </Link>

      {canManage && (
        <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
          <button
            type="button"
            onClick={() => {
              setName(cat.title);
              setEditing(true);
            }}
            aria-label={`Rename ${cat.title}`}
            title="Rename category"
            className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-surface-500 shadow-sm ring-1 ring-surface-200 transition-colors hover:text-primary-600 dark:bg-surface-800 dark:text-surface-300 dark:ring-surface-700 dark:hover:text-primary-400"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${cat.title}`}
            title="Delete category"
            className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-surface-500 shadow-sm ring-1 ring-surface-200 transition-colors hover:text-red-600 dark:bg-surface-800 dark:text-surface-300 dark:ring-surface-700 dark:hover:text-red-400"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
