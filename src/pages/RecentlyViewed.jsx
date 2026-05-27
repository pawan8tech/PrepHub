import { Link } from 'react-router-dom';
import { useRecent } from '../context/RecentContext';
import { useBookmarks } from '../context/BookmarkContext';
import { getContentBySlug, getCategoryBySlug } from '../data';
import { getTopicRoute } from '../hooks/useSearch';
import EmptyState from '../components/common/EmptyState';

export default function RecentlyViewed() {
  const { recent, clearRecent } = useRecent();
  const { isBookmarked } = useBookmarks();

  const resolved = recent
    .map((slug) => {
      const topic = getContentBySlug(slug);
      return topic ? { ...topic, _slug: slug } : null;
    })
    .filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-white">
            Recently Viewed
          </h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            {resolved.length > 0
              ? `${resolved.length} topic${resolved.length !== 1 ? 's' : ''} you've visited recently.`
              : 'Topics you open will appear here.'}
          </p>
        </div>
        {resolved.length > 0 && (
          <button
            onClick={clearRecent}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            Clear history
          </button>
        )}
      </div>

      {resolved.length === 0 ? (
        <EmptyState
          icon="🕐"
          title="No recent topics"
          description="Topics you open will appear here so you can quickly get back to them."
          action={
            <Link
              to="/categories"
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              Start Learning
            </Link>
          }
        />
      ) : (
        <div className="space-y-2">
          {resolved.map((item, i) => {
            const cat = getCategoryBySlug(item.category);
            const bookmarked = isBookmarked(item._slug);

            return (
              <Link
                key={item._slug}
                to={getTopicRoute(item)}
                className="group flex items-center gap-3 rounded-lg border border-surface-200 bg-white px-4 py-3 transition-colors hover:border-surface-300 hover:shadow-sm dark:border-surface-800 dark:bg-surface-900 dark:hover:border-surface-700"
              >
                {/* Order number */}
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-100 text-[11px] font-medium text-surface-400 dark:bg-surface-800 dark:text-surface-500">
                  {i + 1}
                </span>

                {/* Category icon */}
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-100 text-sm dark:bg-surface-800">
                  {cat?.icon || '📄'}
                </span>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-surface-800 group-hover:text-primary-600 dark:text-surface-200 dark:group-hover:text-primary-400">
                    {item.title}
                  </p>
                  <span className="text-[11px] text-surface-400 dark:text-surface-500">
                    {cat?.title || item.category}
                  </span>
                </div>

                {/* Indicators */}
                <div className="flex shrink-0 items-center gap-2">
                  {bookmarked && (
                    <svg className="h-3.5 w-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  )}
                  <svg className="h-4 w-4 text-surface-300 group-hover:text-surface-400 dark:text-surface-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
