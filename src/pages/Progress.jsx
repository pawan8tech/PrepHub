import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProgress } from '../context/ProgressContext';
import { useProgressStats } from '../hooks/useProgressStats';
import { getTopicRoute } from '../hooks/useSearch';
import EmptyState from '../components/common/EmptyState';

const statusConfig = {
  completed: { label: 'Completed', dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
  revised: { label: 'Revised', dot: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400' },
  learning: { label: 'Learning', dot: 'bg-amber-400', text: 'text-amber-600 dark:text-amber-400' },
  'not-started': { label: 'Not Started', dot: 'bg-surface-300 dark:bg-surface-600', text: 'text-surface-500 dark:text-surface-400' },
};

export default function Progress() {
  const { clearProgress } = useProgress();
  const { overall, categoryList } = useProgressStats();
  const [expandedCat, setExpandedCat] = useState(null);

  const hasAnyProgress = overall.completed + overall.revised + overall.learning > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-white">
            Progress
          </h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            Track your preparation across all topics and categories.
          </p>
        </div>
        {hasAnyProgress && (
          <button
            onClick={clearProgress}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            Reset all
          </button>
        )}
      </div>

      {!hasAnyProgress ? (
        <EmptyState
          icon="📊"
          title="No progress tracked yet"
          description="Start marking topics as completed, revised, or learning to see your progress here."
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
        <>
          {/* Overall summary */}
          <div className="rounded-xl border border-surface-200 bg-white p-5 dark:border-surface-800 dark:bg-surface-900">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="text-sm font-medium text-surface-500 dark:text-surface-400">
                  Overall Progress
                </p>
                <p className="text-3xl font-bold text-surface-900 dark:text-white">
                  {overall.percent}%
                </p>
              </div>
              <p className="text-xs text-surface-400 dark:text-surface-500">
                {overall.completed + overall.revised} of {overall.total} topics
              </p>
            </div>

            {/* Overall progress bar */}
            <ProgressBar
              completed={overall.completed}
              revised={overall.revised}
              learning={overall.learning}
              total={overall.total}
            />

            {/* Legend */}
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
              <Legend dot="bg-emerald-500" label="Completed" value={overall.completed} />
              <Legend dot="bg-blue-500" label="Revised" value={overall.revised} />
              <Legend dot="bg-amber-400" label="Learning" value={overall.learning} />
              <Legend dot="bg-surface-200 dark:bg-surface-700" label="Not Started" value={overall.notStarted} />
            </div>
          </div>

          {/* Per-category breakdown */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-surface-700 dark:text-surface-300">
              By Category
            </h2>

            {categoryList.map((cat) => {
              const catProgress = cat.completed + cat.revised;
              const catPercent = cat.total > 0 ? Math.round((catProgress / cat.total) * 100) : 0;
              const isExpanded = expandedCat === cat.slug;

              return (
                <div
                  key={cat.slug}
                  className="overflow-hidden rounded-xl border border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-900"
                >
                  {/* Category header (clickable) */}
                  <button
                    onClick={() => setExpandedCat(isExpanded ? null : cat.slug)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-50 dark:hover:bg-surface-800/50"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-100 text-sm dark:bg-surface-800">
                      {cat.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-surface-800 dark:text-surface-200">
                          {cat.title}
                        </p>
                        <span className="text-xs font-medium text-surface-500 dark:text-surface-400">
                          {catPercent}%
                        </span>
                      </div>
                      <div className="mt-1.5">
                        <ProgressBar
                          completed={cat.completed}
                          revised={cat.revised}
                          learning={cat.learning}
                          total={cat.total}
                          size="sm"
                        />
                      </div>
                    </div>
                    <div className="ml-2 flex shrink-0 items-center gap-3">
                      <span className="text-[11px] text-surface-400 dark:text-surface-500">
                        {catProgress}/{cat.total}
                      </span>
                      <svg
                        className={`h-4 w-4 text-surface-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Expanded topic list */}
                  {isExpanded && (
                    <div className="border-t border-surface-100 dark:border-surface-800">
                      {cat.topics.map((item) => {
                        const cfg = statusConfig[item._status] || statusConfig['not-started'];
                        return (
                          <Link
                            key={item.slug}
                            to={getTopicRoute(item)}
                            className="group flex items-center gap-3 border-b border-surface-50 px-4 py-2.5 last:border-b-0 hover:bg-surface-50 dark:border-surface-800/50 dark:hover:bg-surface-800/30"
                          >
                            <span className={`h-2 w-2 shrink-0 rounded-full ${cfg.dot}`} />
                            <p className="min-w-0 flex-1 truncate text-sm text-surface-700 group-hover:text-primary-600 dark:text-surface-300 dark:group-hover:text-primary-400">
                              {item.title}
                            </p>
                            <span className={`shrink-0 text-[11px] font-medium ${cfg.text}`}>
                              {cfg.label}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function ProgressBar({ completed, revised, learning, total, size = 'md' }) {
  if (total === 0) return null;

  const pCompleted = (completed / total) * 100;
  const pRevised = (revised / total) * 100;
  const pLearning = (learning / total) * 100;

  const h = size === 'sm' ? 'h-1.5' : 'h-2.5';

  return (
    <div className={`flex ${h} w-full overflow-hidden rounded-full bg-surface-100 dark:bg-surface-800`}>
      {pCompleted > 0 && (
        <div
          className="bg-emerald-500 transition-all duration-500"
          style={{ width: `${pCompleted}%` }}
        />
      )}
      {pRevised > 0 && (
        <div
          className="bg-blue-500 transition-all duration-500"
          style={{ width: `${pRevised}%` }}
        />
      )}
      {pLearning > 0 && (
        <div
          className="bg-amber-400 transition-all duration-500"
          style={{ width: `${pLearning}%` }}
        />
      )}
    </div>
  );
}

function Legend({ dot, label, value }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      <span className="text-xs text-surface-500 dark:text-surface-400">
        {label}
      </span>
      <span className="text-xs font-medium text-surface-700 dark:text-surface-300">
        {value}
      </span>
    </div>
  );
}
