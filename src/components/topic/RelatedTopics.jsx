import { Link } from 'react-router-dom';
import { resolveRelatedTopics, getCategoryBySlug } from '../../data';
import { getTopicRoute } from '../../hooks/useSearch';

export default function RelatedTopics({ slugs = [] }) {
  const related = resolveRelatedTopics(slugs);

  if (related.length === 0) return null;

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-surface-800 dark:text-surface-200">
        Related Topics
      </h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {related.map((item) => {
          const cat = getCategoryBySlug(item.category);
          return (
            <Link
              key={item.slug}
              to={getTopicRoute(item)}
              className="group flex items-center gap-3 rounded-lg border border-surface-200 bg-white px-4 py-3 transition-colors hover:border-surface-300 hover:bg-surface-50 dark:border-surface-800 dark:bg-surface-900 dark:hover:border-surface-700 dark:hover:bg-surface-800/50"
            >
              {cat && <span className="text-sm">{cat.icon}</span>}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-surface-700 group-hover:text-primary-600 dark:text-surface-300 dark:group-hover:text-primary-400">
                  {item.title}
                </p>
                <p className="truncate text-[11px] text-surface-400 dark:text-surface-500">
                  {cat?.title || item.category}
                </p>
              </div>
              <svg className="h-4 w-4 shrink-0 text-surface-300 group-hover:text-surface-400 dark:text-surface-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
