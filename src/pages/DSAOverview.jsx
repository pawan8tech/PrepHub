import { Link } from 'react-router-dom';
import { allDSATopics } from '../data';
import { useBookmarks } from '../context/BookmarkContext';
import { useProgress } from '../context/ProgressContext';

const difficultyOrder = { easy: 0, medium: 1, hard: 2 };

const difficultyStyles = {
  easy: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-400',
  medium: 'bg-amber-50 text-amber-700 dark:bg-amber-900/25 dark:text-amber-400',
  hard: 'bg-red-50 text-red-700 dark:bg-red-900/25 dark:text-red-400',
};

const statusDots = {
  'not-started': '',
  learning: 'bg-amber-400',
  revised: 'bg-blue-500',
  completed: 'bg-emerald-500',
};

const dsaIcons = {
  'two-pointers': '👈',
  'sliding-window': '🪟',
  'prefix-sum': '➕',
  hashing: '#️⃣',
  'fast-slow-pointer': '🐢',
  'binary-search': '🔍',
  'recursion-backtracking': '🔄',
  'divide-and-conquer': '✂️',
  greedy: '💰',
  dp: '🧠',
  'kadanes-algorithm': '📈',
  stack: '📚',
  'monotonic-stack': '📶',
  queue: '🚶',
  dfs: '🕳️',
  graph: '🕸️',
  tree: '🌳',
  heap: '⛰️',
  'bit-manipulation': '🔢',
  trie: '🔤',
  'union-find': '🔗',
  'topological-sort': '📋',
};

export default function DSAOverview() {
  const { isBookmarked } = useBookmarks();
  const { getTopicStatus } = useProgress();

  const completedCount = allDSATopics.filter(
    (t) => getTopicStatus(t.slug) === 'completed'
  ).length;
  const totalQuestions = allDSATopics.reduce(
    (sum, t) => sum + (t.questions?.length || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
          Data Structures & Algorithms
        </h1>
        <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
          Master DSA topics with pattern-based learning and curated problem lists.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Topics"
          value={allDSATopics.length}
          color="text-primary-600 dark:text-primary-400"
        />
        <StatCard
          label="Completed"
          value={`${completedCount}/${allDSATopics.length}`}
          color="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          label="Problems"
          value={totalQuestions}
          color="text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* Topic cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {allDSATopics.map((topic) => {
          const status = getTopicStatus(topic.slug);
          const dotClass = statusDots[status];
          const bookmarked = isBookmarked(topic.slug);
          const questionCount = topic.questions?.length || 0;

          return (
            <Link
              key={topic.slug}
              to={`/dsa/${topic.slug}`}
              className="group relative flex gap-4 rounded-xl border border-surface-200 bg-white p-4 transition-all hover:border-surface-300 hover:shadow-sm dark:border-surface-800 dark:bg-surface-900 dark:hover:border-surface-700"
            >
              {/* Icon */}
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-100 text-xl dark:bg-surface-800">
                {dsaIcons[topic.slug] || '🧩'}
              </span>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-semibold text-surface-800 group-hover:text-primary-600 dark:text-surface-200 dark:group-hover:text-primary-400">
                    {topic.title}
                  </h3>

                  {bookmarked && (
                    <svg className="h-3.5 w-3.5 shrink-0 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  )}
                </div>

                <p className="mt-0.5 line-clamp-1 text-xs text-surface-500 dark:text-surface-400">
                  {topic.content.learning.explanation
                    ? topic.content.learning.explanation.slice(0, 100) + '...'
                    : 'Content coming soon'}
                </p>

                {/* Meta row */}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      difficultyStyles[topic.difficulty] || difficultyStyles.medium
                    }`}
                  >
                    {topic.difficulty}
                  </span>

                  {questionCount > 0 && (
                    <span className="text-[11px] text-surface-400 dark:text-surface-500">
                      {questionCount} problem{questionCount !== 1 && 's'}
                    </span>
                  )}

                  {dotClass && (
                    <span className="flex items-center gap-1 text-[11px] text-surface-400 dark:text-surface-500">
                      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
                      {status.replace('-', ' ')}
                    </span>
                  )}
                </div>
              </div>

              {/* Arrow */}
              <svg className="mt-1 h-4 w-4 shrink-0 text-surface-300 group-hover:text-surface-400 dark:text-surface-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="rounded-lg border border-surface-200 bg-white p-3 dark:border-surface-800 dark:bg-surface-900">
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-surface-500 dark:text-surface-400">{label}</p>
    </div>
  );
}
