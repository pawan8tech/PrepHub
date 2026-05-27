import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getContentBySlug } from '../data';
import { useBookmarks } from '../context/BookmarkContext';
import { useRecent } from '../context/RecentContext';
import { useProgress } from '../context/ProgressContext';
import { useNotes } from '../context/NotesContext';
import { useAuth } from '../context/AuthContext';
import { useAllCategories } from '../hooks/useAllCategories';
import { useProgressStats } from '../hooks/useProgressStats';
import { getTopicRoute } from '../hooks/useSearch';

export default function Dashboard() {
  const { bookmarks } = useBookmarks();
  const { recent } = useRecent();
  const { progress } = useProgress();
  const { notes } = useNotes();
  const { user } = useAuth();
  const { allCategories, getCategoryBySlug } = useAllCategories();
  const { overall, categoryList } = useProgressStats();

  const continueItems = useMemo(() => {
    const inProgress = Object.entries(progress)
      .filter(([, status]) => status === 'learning' || status === 'revised')
      .map(([slug]) => slug);

    const recentSet = new Set(recent);
    inProgress.sort((a, b) => {
      const aIdx = recent.indexOf(a);
      const bIdx = recent.indexOf(b);
      if (aIdx >= 0 && bIdx >= 0) return aIdx - bIdx;
      if (aIdx >= 0) return -1;
      if (bIdx >= 0) return 1;
      return 0;
    });

    return inProgress.slice(0, 5).map((s) => getContentBySlug(s)).filter(Boolean);
  }, [progress, recent]);

  const recentItems = useMemo(
    () => recent.slice(0, 5).map((s) => getContentBySlug(s)).filter(Boolean),
    [recent],
  );

  const recentNotes = useMemo(() => {
    if (!user) return [];
    return Object.entries(notes)
      .filter(([, n]) => n.updatedAt)
      .sort((a, b) => {
        const ta = typeof a[1].updatedAt === 'string' ? new Date(a[1].updatedAt).getTime() : a[1].updatedAt?.seconds * 1000 || 0;
        const tb = typeof b[1].updatedAt === 'string' ? new Date(b[1].updatedAt).getTime() : b[1].updatedAt?.seconds * 1000 || 0;
        return tb - ta;
      })
      .slice(0, 5)
      .map(([slug, n]) => {
        const topic = getContentBySlug(slug);
        if (!topic) return null;
        const ts = typeof n.updatedAt === 'string' ? new Date(n.updatedAt) : n.updatedAt?.toDate?.() || new Date(n.updatedAt?.seconds * 1000);
        return { ...topic, _updatedAt: ts };
      })
      .filter(Boolean);
  }, [notes, user]);

  const bookmarkedItems = useMemo(
    () => bookmarks.slice(0, 5).map((s) => getContentBySlug(s)).filter(Boolean),
    [bookmarks],
  );

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
          Welcome back
        </h1>
        <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
          Continue your preparation journey. Pick up where you left off.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Completed" value={overall.completed} color="text-emerald-600 dark:text-emerald-400" />
        <StatCard label="Revised" value={overall.revised} color="text-blue-600 dark:text-blue-400" />
        <StatCard label="Learning" value={overall.learning} color="text-amber-600 dark:text-amber-400" />
        <StatCard label="Bookmarked" value={bookmarks.length} color="text-purple-600 dark:text-purple-400" />
      </div>

      {/* Continue Learning */}
      {continueItems.length > 0 && (
        <section>
          <SectionHeader title="Continue Learning" to="/progress" />
          <div className="grid gap-3 sm:grid-cols-2">
            {continueItems.map((item) => (
              <ContinueCard key={item.slug} item={item} status={progress[item.slug]} getCategoryBySlug={getCategoryBySlug} />
            ))}
          </div>
        </section>
      )}

      {/* Recently Viewed */}
      {recentItems.length > 0 && (
        <section>
          <SectionHeader title="Recently Viewed" to="/recent" />
          <div className="space-y-1.5">
            {recentItems.map((item) => (
              <TopicRow key={item.slug} item={item} getCategoryBySlug={getCategoryBySlug} />
            ))}
          </div>
        </section>
      )}

      {/* Recently Updated Notes */}
      {recentNotes.length > 0 && (
        <section>
          <SectionHeader title="Recently Updated Notes" to="/bookmarks" />
          <div className="space-y-1.5">
            {recentNotes.map((item) => (
              <TopicRow key={item.slug} item={item} getCategoryBySlug={getCategoryBySlug} trailing={<TimeAgo date={item._updatedAt} />} />
            ))}
          </div>
        </section>
      )}

      {/* Bookmarked Topics */}
      {bookmarkedItems.length > 0 && (
        <section>
          <SectionHeader title="Bookmarked Topics" to="/bookmarks" />
          <div className="space-y-1.5">
            {bookmarkedItems.map((item) => (
              <TopicRow key={item.slug} item={item} getCategoryBySlug={getCategoryBySlug} showBookmark />
            ))}
          </div>
        </section>
      )}

      {/* Progress Overview */}
      {(overall.completed + overall.revised + overall.learning > 0) && (
        <section>
          <SectionHeader title="Progress Overview" to="/progress" />
          <div className="rounded-xl border border-surface-200 bg-white p-4 dark:border-surface-800 dark:bg-surface-900">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                Overall — {overall.percent}%
              </span>
              <span className="text-xs text-surface-400 dark:text-surface-500">
                {overall.completed + overall.revised}/{overall.total}
              </span>
            </div>
            <MiniBar
              completed={overall.completed}
              revised={overall.revised}
              learning={overall.learning}
              total={overall.total}
            />

            <div className="mt-4 space-y-3">
              {categoryList.map((cat) => {
                const done = cat.completed + cat.revised;
                const pct = cat.total > 0 ? Math.round((done / cat.total) * 100) : 0;

                return (
                  <div key={cat.slug}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-surface-600 dark:text-surface-400">
                        <span>{cat.icon}</span>
                        {cat.title}
                      </span>
                      <span className="text-[11px] text-surface-400 dark:text-surface-500">
                        {done}/{cat.total} · {pct}%
                      </span>
                    </div>
                    <MiniBar
                      completed={cat.completed}
                      revised={cat.revised}
                      learning={cat.learning}
                      total={cat.total}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      <section>
        <SectionHeader title="Categories" to="/categories" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {allCategories.map((cat) => (
            <Link
              key={cat.slug}
              to={cat.slug === 'dsa' ? '/dsa' : `/category/${cat.slug}`}
              className="group flex flex-col rounded-lg border border-surface-200 bg-white p-4 transition-all hover:border-surface-300 hover:shadow-sm dark:border-surface-800 dark:bg-surface-900 dark:hover:border-surface-700"
            >
              <span className="mb-2 text-2xl">{cat.icon}</span>
              <span className="text-sm font-semibold text-surface-800 group-hover:text-primary-600 dark:text-surface-200 dark:group-hover:text-primary-400">
                {cat.title}
              </span>
              <span className="mt-0.5 text-xs text-surface-400 dark:text-surface-500 line-clamp-2">
                {cat.description}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────

const statusMeta = {
  learning: { label: 'Learning', dot: 'bg-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/15' },
  revised:  { label: 'Revised',  dot: 'bg-blue-500',  bg: 'bg-blue-50 dark:bg-blue-900/15' },
};

function ContinueCard({ item, status, getCategoryBySlug }) {
  const cat = getCategoryBySlug(item.category);
  const meta = statusMeta[status] || statusMeta.learning;

  return (
    <Link
      to={getTopicRoute(item)}
      className={`group flex items-start gap-3 rounded-xl border border-surface-200 p-4 transition-all hover:border-surface-300 hover:shadow-sm dark:border-surface-800 dark:hover:border-surface-700 ${meta.bg}`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/80 text-base dark:bg-surface-800/80">
        {cat?.icon || '📄'}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-surface-800 group-hover:text-primary-600 dark:text-surface-200 dark:group-hover:text-primary-400">
          {item.title}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] text-surface-500 dark:text-surface-400">
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
          </span>
          <span className="text-[11px] text-surface-400 dark:text-surface-500">
            {cat?.title || item.category}
          </span>
        </div>
      </div>
      <svg className="mt-1 h-4 w-4 shrink-0 text-surface-300 group-hover:text-surface-500 dark:text-surface-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

function MiniBar({ completed, revised, learning, total }) {
  if (total === 0) return null;

  const pC = (completed / total) * 100;
  const pR = (revised / total) * 100;
  const pL = (learning / total) * 100;

  return (
    <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-surface-100 dark:bg-surface-800">
      {pC > 0 && <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${pC}%` }} />}
      {pR > 0 && <div className="bg-blue-500 transition-all duration-500" style={{ width: `${pR}%` }} />}
      {pL > 0 && <div className="bg-amber-400 transition-all duration-500" style={{ width: `${pL}%` }} />}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="rounded-lg border border-surface-200 bg-white p-3 dark:border-surface-800 dark:bg-surface-900">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-surface-500 dark:text-surface-400">{label}</p>
    </div>
  );
}

function SectionHeader({ title, to }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-semibold text-surface-700 dark:text-surface-300">
        {title}
      </h2>
      <Link
        to={to}
        className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
      >
        View all
      </Link>
    </div>
  );
}

function TopicRow({ item, showBookmark, trailing, getCategoryBySlug }) {
  const cat = getCategoryBySlug(item.category);

  return (
    <Link
      to={getTopicRoute(item)}
      className="group flex items-center gap-3 rounded-lg border border-surface-200 bg-white px-3 py-2.5 transition-colors hover:border-surface-300 dark:border-surface-800 dark:bg-surface-900 dark:hover:border-surface-700"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-100 text-xs dark:bg-surface-800">
        {cat?.icon || '📄'}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-surface-700 group-hover:text-primary-600 dark:text-surface-300 dark:group-hover:text-primary-400">
          {item.title}
        </p>
      </div>
      {trailing || (
        <span className="shrink-0 text-[11px] text-surface-400 dark:text-surface-500">
          {cat?.title || item.category}
        </span>
      )}
      {showBookmark && (
        <svg className="h-3.5 w-3.5 shrink-0 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      )}
    </Link>
  );
}

function TimeAgo({ date }) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) return null;

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  let label;
  if (seconds < 60) label = 'just now';
  else if (seconds < 3600) label = `${Math.floor(seconds / 60)}m ago`;
  else if (seconds < 86400) label = `${Math.floor(seconds / 3600)}h ago`;
  else label = `${Math.floor(seconds / 86400)}d ago`;

  return (
    <span className="shrink-0 text-[11px] text-surface-400 dark:text-surface-500">
      {label}
    </span>
  );
}
