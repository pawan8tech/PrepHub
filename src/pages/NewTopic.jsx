import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAllCategories } from '../hooks/useAllCategories';
import { useNotes } from '../context/NotesContext';
import { createBlock } from '../utils/editorBlockModel';
import { BlockListEditor } from '../components/topic/TopicDocument';
import EmptyState from '../components/common/EmptyState';

function toSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const DEFAULT_INTERVIEW_SEED = [
  { type: 'heading', level: 2, content: 'Description' },
  { type: 'text', content: '' },
  { type: 'heading', level: 2, content: 'Important Points' },
  { type: 'list', items: [''] },
];

export default function NewTopic() {
  const { user } = useAuth();
  const { allCategories } = useAllCategories();
  const { createTopicNote } = useNotes();
  const navigate = useNavigate();

  const selectableCategories = useMemo(
    () => allCategories.filter((c) => c.slug !== 'dsa'),
    [allCategories],
  );

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(selectableCategories[0]?.slug || '');
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [blocks, setBlocks] = useState(() => [createBlock('text')]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!user) {
    return (
      <EmptyState
        icon="🔒"
        title="Sign in required"
        description="You need to sign in to create new topics."
      />
    );
  }

  const handleCreate = async () => {
    setError('');
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    let finalCategory = category;
    if (showNewCat && newCatName.trim()) {
      finalCategory = `custom-${toSlug(newCatName.trim())}`;
    }
    if (!finalCategory) {
      setError('Please select or create a category');
      return;
    }

    setSaving(true);
    try {
      const slug = `custom-${toSlug(title.trim())}`;
      const cleanedBlocks = blocks.filter(
        (b) => b && typeof b === 'object' && b.type && !isEmptyBlock(b),
      );
      const learningSeed =
        cleanedBlocks.length > 0
          ? cleanedBlocks
          : [{ type: 'text', content: '' }];

      await createTopicNote({
        slug,
        title: title.trim(),
        category: finalCategory,
        initialByMode: {
          learning: learningSeed,
          interview: DEFAULT_INTERVIEW_SEED,
        },
      });

      navigate(`/topic/${slug}`);
    } catch (err) {
      console.error('Failed to create topic:', err);
      setError('Failed to create topic. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-surface-400 dark:text-surface-500">
        <Link to="/categories" className="transition-colors hover:text-primary-600 dark:hover:text-primary-400">
          Categories
        </Link>
        <ChevronIcon />
        <span className="truncate text-surface-700 dark:text-surface-300">New topic</span>
      </nav>

      {/* Header — editable title + actions */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Topic title"
            autoFocus
            className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[28px] font-semibold leading-tight text-surface-900 outline-none placeholder:text-surface-400 dark:text-white dark:placeholder:text-surface-600"
          />
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/categories')}
              disabled={saving}
              className="rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-xs font-medium text-surface-700 transition-colors hover:bg-surface-50 disabled:opacity-50 dark:border-surface-600 dark:bg-surface-900 dark:text-surface-200 dark:hover:bg-surface-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={saving || !title.trim()}
              className="rounded-lg border border-primary-300 bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50 dark:border-primary-600 dark:bg-primary-500 dark:hover:bg-primary-600"
            >
              {saving ? 'Creating…' : 'Create topic'}
            </button>
          </div>
        </div>

        {/* Category picker */}
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-medium uppercase tracking-wide text-surface-500 dark:text-surface-400">
            Category
          </label>
          {!showNewCat ? (
            <>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-md border border-surface-200 bg-white px-2 py-1 text-xs text-surface-800 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-100 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200"
              >
                {selectableCategories.length === 0 ? (
                  <option value="">No categories yet</option>
                ) : (
                  selectableCategories.map((cat) => (
                    <option key={cat.slug} value={cat.slug}>
                      {cat.icon} {cat.title}
                    </option>
                  ))
                )}
              </select>
              <button
                type="button"
                onClick={() => setShowNewCat(true)}
                className="rounded-md border border-dashed border-surface-300 px-2 py-1 text-xs font-medium text-surface-600 transition-colors hover:border-primary-300 hover:text-primary-600 dark:border-surface-600 dark:text-surface-400 dark:hover:border-primary-700 dark:hover:text-primary-400"
              >
                + New category
              </button>
            </>
          ) : (
            <>
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="New category name"
                autoFocus
                className="rounded-md border border-surface-200 bg-white px-2 py-1 text-xs text-surface-800 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-100 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200"
              />
              <button
                type="button"
                onClick={() => {
                  setShowNewCat(false);
                  setNewCatName('');
                }}
                className="rounded-md px-2 py-1 text-xs text-surface-500 transition-colors hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200"
              >
                Cancel
              </button>
            </>
          )}
        </div>

        {/* Error */}
        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </p>
        ) : null}
      </div>

      {/* Inline block editor — same component used on topic pages */}
      <div className="topic-document">
        <BlockListEditor blocks={blocks} onChange={setBlocks} depth={0} />
      </div>
    </div>
  );
}

function isEmptyBlock(b) {
  if (b.type === 'text' || b.type === 'heading' || b.type === 'callout' || b.type === 'code') {
    return !String(b.content ?? '').trim();
  }
  if (b.type === 'list') {
    const items = Array.isArray(b.items) ? b.items.map(String) : [];
    return items.every((x) => !x.trim());
  }
  if (b.type === 'qna') {
    const qEmpty = !String(b.question ?? '').trim();
    const answer = Array.isArray(b.answer) ? b.answer : [];
    const aEmpty = answer.length === 0 || answer.every(isEmptyBlock);
    return qEmpty && aEmpty;
  }
  return false;
}

function ChevronIcon() {
  return (
    <svg className="h-3.5 w-3.5 shrink-0 text-surface-300 dark:text-surface-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
