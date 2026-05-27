import { Link } from 'react-router-dom';
import { useBookmarks } from '../context/BookmarkContext';
import { useProgress } from '../context/ProgressContext';
import { getContentBySlug, getCategoryBySlug } from '../data';
import { getTopicRoute } from '../hooks/useSearch';
import EmptyState from '../components/common/EmptyState';

const statusDots = {
  'not-started': '',
  learning: 'bg-amber-400',
  revised: 'bg-blue-500',
  completed: 'bg-emerald-500',
};

export default function Bookmarks() {
  const { bookmarks, toggleBookmark, clearBookmarks } = useBookmarks();
  const { getTopicStatus } = useProgress();

  const resolved = bookmarks
    .map((slug) => {
      const topic = getContentBySlug(slug);
      return topic ? { ...topic, _slug: slug } : { _slug: slug, title: slug, category: '' };
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-white">
            Bookmarks
          </h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            {bookmarks.length > 0
              ? `${bookmarks.length} saved topic${bookmarks.length !== 1 ? 's' : ''} for quick revision.`
              : 'Your saved topics for quick access.'}
          </p>
        </div>
        {bookmarks.length > 0 && (
          <button
            onClick={clearBookmarks}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            Clear all
          </button>
        )}
      </div>

      {resolved.length === 0 ? (
        <EmptyState
          icon="🔖"
          title="No bookmarks yet"
          description="Bookmark topics while studying to save them here for quick revision."
          action={
            <Link
              to="/categories"
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              Browse Topics
            </Link>
          }
        />
      ) : (
        <div className="space-y-2">
          {resolved.map((item) => {
            const cat = getCategoryBySlug(item.category);
            const status = getTopicStatus(item._slug);
            const dotClass = statusDots[status];
            const route = item.id ? getTopicRoute(item) : `/topic/${item._slug}`;

            return (
              <div
                key={item._slug}
                className="group flex items-center gap-3 rounded-lg border border-surface-200 bg-white px-4 py-3 transition-colors hover:border-surface-300 dark:border-surface-800 dark:bg-surface-900 dark:hover:border-surface-700"
              >
                {/* Category icon */}
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-100 text-sm dark:bg-surface-800">
                  {cat?.icon || '📄'}
                </span>

                {/* Content */}
                <Link to={route} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-surface-800 group-hover:text-primary-600 dark:text-surface-200 dark:group-hover:text-primary-400">
                    {item.title}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="text-[11px] text-surface-400 dark:text-surface-500">
                      {cat?.title || item.category || 'Unknown'}
                    </span>
                    {dotClass && (
                      <span className="flex items-center gap-1 text-[11px] text-surface-400 dark:text-surface-500">
                        <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
                        {status.replace('-', ' ')}
                      </span>
                    )}
                  </div>
                </Link>

                {/* Remove button */}
                <button
                  onClick={() => toggleBookmark(item._slug)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-surface-300 transition-colors hover:bg-red-50 hover:text-red-400 dark:text-surface-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  title="Remove bookmark"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
