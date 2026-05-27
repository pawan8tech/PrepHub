import { Link } from 'react-router-dom';
import { useAllCategories } from '../hooks/useAllCategories';

export default function Categories() {
  const { allCategories } = useAllCategories();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-surface-900 dark:text-white">
          All Categories
        </h1>
        <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
          Browse topics organized by technology and subject area.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {allCategories.map((cat) => (
          <Link
            key={cat.slug}
            to={cat.slug === 'dsa' ? '/dsa' : `/category/${cat.slug}`}
            className="group flex items-start gap-4 rounded-xl border border-surface-200 bg-white p-5 transition-all hover:border-surface-300 hover:shadow-md dark:border-surface-800 dark:bg-surface-900 dark:hover:border-surface-700"
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
        ))}
      </div>
    </div>
  );
}
