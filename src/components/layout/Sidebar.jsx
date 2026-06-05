import { useState, useEffect, useCallback, useMemo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { categories as systemCategories } from '../../data/categories';
import { useCustomCategories } from '../../context/CustomCategoriesContext';
import { useAllContent } from '../../hooks/useAllContent';
import { useAuth } from '../../context/AuthContext';
import { useProgress } from '../../context/ProgressContext';
import { useTopicOrder } from '../../context/TopicOrderContext';
import { moveItem } from '../../utils/topicOrderArch';

const navItems = [
  { to: '/', label: 'Dashboard', icon: DashboardIcon },
  { to: '/categories', label: 'Categories', icon: GridIcon },
  { to: '/dsa', label: 'DSA', icon: CodeIcon },
  { to: '/topic/new', label: 'Add Topic', icon: PlusIcon },
  { to: '/bookmarks', label: 'Bookmarks', icon: BookmarkIcon },
  { to: '/recent', label: 'Recent', icon: ClockIcon },
  { to: '/progress', label: 'Progress', icon: ChartIcon },
  { to: '/settings', label: 'Settings', icon: GearIcon },
];

const statusDot = {
  'not-started': 'border-2 border-surface-300 dark:border-surface-600',
  learning: 'bg-amber-400',
  revised: 'bg-blue-500',
  completed: 'bg-emerald-500',
};

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const { customCategories } = useCustomCategories();
  const { getTopicsByCategory } = useAllContent();
  const { getTopicStatus } = useProgress();
  const { applyOrder, setOrder, resetOrder, hasUserOverride, canReorder } = useTopicOrder();
  const location = useLocation();
  const navigate = useNavigate();

  const systemCats = systemCategories.filter((c) => c.slug !== 'dsa');
  const hasCustom = user && customCategories.length > 0;

  // Detect if we're on a category page
  const categoryMatch = location.pathname.match(/^\/category\/([^/]+)/);
  const activeCategorySlug = categoryMatch ? categoryMatch[1] : null;

  // Local accordion state — allows toggling the topic sub-list independently
  const [expandedSlug, setExpandedSlug] = useState(activeCategorySlug);

  // Per-category reorder mode. Only one category is in reorder mode at a time.
  const [reorderingSlug, setReorderingSlug] = useState(null);

  // Sync expandedSlug when the route changes to a new category
  useEffect(() => {
    setExpandedSlug(activeCategorySlug);
  }, [activeCategorySlug]);

  // Exit reorder mode if the category is no longer expanded
  useEffect(() => {
    if (reorderingSlug && reorderingSlug !== expandedSlug) {
      setReorderingSlug(null);
    }
  }, [expandedSlug, reorderingSlug]);

  const expandedTopics = useMemo(() => {
    if (!expandedSlug) return [];
    const raw = getTopicsByCategory(expandedSlug);
    return applyOrder(expandedSlug, raw);
  }, [expandedSlug, getTopicsByCategory, applyOrder]);

  const toggleReorder = useCallback(
    (slug) => {
      setReorderingSlug((prev) => (prev === slug ? null : slug));
    },
    [],
  );

  const handleMoveTopic = useCallback(
    (categorySlug, fromIndex, toIndex) => {
      const raw = getTopicsByCategory(categorySlug);
      const ordered = applyOrder(categorySlug, raw);
      const slugs = ordered.map((t) => t.slug);
      const next = moveItem(slugs, fromIndex, toIndex);
      if (next === slugs) return;
      setOrder(categorySlug, next);
    },
    [getTopicsByCategory, applyOrder, setOrder],
  );

  const handleResetOrder = useCallback(
    (categorySlug) => {
      resetOrder(categorySlug);
    },
    [resetOrder],
  );

  // Scroll spy — track which topic is visible
  const [visibleSlug, setVisibleSlug] = useState(null);

  useEffect(() => {
    if (!activeCategorySlug) return;

    const handler = (e) => setVisibleSlug(e.detail);
    window.addEventListener('topic-visible', handler);
    return () => window.removeEventListener('topic-visible', handler);
  }, [activeCategorySlug]);

  // Reset visible slug on category change
  useEffect(() => {
    setVisibleSlug(null);
  }, [activeCategorySlug]);

  const handleCategoryClick = useCallback(
    (slug) => {
      if (activeCategorySlug === slug) {
        setExpandedSlug((prev) => (prev === slug ? null : slug));
      } else {
        setExpandedSlug(slug);
        navigate(`/category/${slug}`);
      }
      onClose();
    },
    [activeCategorySlug, navigate, onClose],
  );

  const scrollToTopic = useCallback(
    (slug) => {
      const el = document.getElementById(`topic-${slug}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        onClose();
      } else if (activeCategorySlug) {
        navigate(`/category/${activeCategorySlug}#topic-${slug}`);
        onClose();
      }
    },
    [activeCategorySlug, navigate, onClose],
  );

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-14 z-50 flex h-[calc(100vh-3.5rem)] w-64 flex-col border-r border-surface-200 bg-white transition-transform duration-200 dark:border-surface-800 dark:bg-surface-950 lg:sticky lg:z-auto lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="flex-1 overflow-y-auto p-3">
          {/* Main nav */}
          <div className="space-y-0.5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                      : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800/50 dark:hover:text-surface-200'
                  }`
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </div>

          {/* System categories */}
          <div className="mt-6">
            <SectionLabel>Categories</SectionLabel>
            <div className="space-y-0.5">
              {systemCats.map((cat) => (
                <CategoryItem
                  key={cat.slug}
                  cat={cat}
                  isActive={activeCategorySlug === cat.slug}
                  isExpanded={expandedSlug === cat.slug}
                  topics={expandedSlug === cat.slug ? expandedTopics : null}
                  visibleSlug={visibleSlug}
                  getTopicStatus={getTopicStatus}
                  onTopicClick={scrollToTopic}
                  onCategoryClick={handleCategoryClick}
                  canReorder={canReorder}
                  isReorderMode={reorderingSlug === cat.slug}
                  onToggleReorder={toggleReorder}
                  onMoveTopic={handleMoveTopic}
                  hasOverride={hasUserOverride(cat.slug)}
                  onResetOverride={handleResetOrder}
                />
              ))}
            </div>
          </div>

          {/* Custom categories */}
          {hasCustom && (
            <div className="mt-5">
              <SectionLabel>My Categories</SectionLabel>
              <div className="space-y-0.5">
                {customCategories.map((cat) => (
                  <CategoryItem
                    key={cat.slug}
                    cat={cat}
                    isCustom
                    isActive={activeCategorySlug === cat.slug}
                    isExpanded={expandedSlug === cat.slug}
                    topics={expandedSlug === cat.slug ? expandedTopics : null}
                    visibleSlug={visibleSlug}
                    getTopicStatus={getTopicStatus}
                    onTopicClick={scrollToTopic}
                    onCategoryClick={handleCategoryClick}
                    canReorder={canReorder}
                    isReorderMode={reorderingSlug === cat.slug}
                    onToggleReorder={toggleReorder}
                    onMoveTopic={handleMoveTopic}
                    hasOverride={hasUserOverride(cat.slug)}
                    onResetOverride={handleResetOrder}
                  />
                ))}
              </div>
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}

// ── Sub-components ──────────────────────────────────────────────────

function CategoryItem({
  cat,
  isCustom,
  isActive,
  isExpanded,
  topics,
  visibleSlug,
  getTopicStatus,
  onTopicClick,
  onCategoryClick,
  canReorder,
  isReorderMode,
  onToggleReorder,
  onMoveTopic,
  hasOverride,
  onResetOverride,
}) {
  const showReorderToggle = canReorder && isExpanded && topics && topics.length > 1;

  // Native drag-and-drop reorder state (no external library).
  // dragIndex = row being dragged; overIndex = row currently hovered as drop target.
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);

  // Clear any in-progress drag when leaving reorder mode.
  useEffect(() => {
    if (!isReorderMode) {
      setDragIndex(null);
      setOverIndex(null);
    }
  }, [isReorderMode]);

  const handleDragStart = useCallback((e, index) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Firefox won't start a drag unless some data is set.
    e.dataTransfer.setData('text/plain', String(index));
  }, []);

  const handleDragOver = useCallback(
    (e, index) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setOverIndex((prev) => (prev === index ? prev : index));
    },
    [],
  );

  const handleDrop = useCallback(
    (e, index) => {
      e.preventDefault();
      if (dragIndex !== null && dragIndex !== index) {
        onMoveTopic(cat.slug, dragIndex, index);
      }
      setDragIndex(null);
      setOverIndex(null);
    },
    [dragIndex, onMoveTopic, cat.slug],
  );

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setOverIndex(null);
  }, []);

  return (
    <div>
      <div
        className={`flex items-center rounded-lg ${
          isActive
            ? 'bg-primary-50 dark:bg-primary-900/30'
            : 'hover:bg-surface-50 dark:hover:bg-surface-800/50'
        }`}
      >
        <button
          onClick={() => onCategoryClick(cat.slug)}
          className={`flex flex-1 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
            isActive
              ? 'font-medium text-primary-700 dark:text-primary-400'
              : 'text-surface-600 hover:text-surface-900 dark:text-surface-400 dark:hover:text-surface-200'
          }`}
        >
          <span className="w-4 text-center text-sm">{cat.icon}</span>
          <span className="flex-1 truncate text-left">{cat.title}</span>
          {isCustom && (
            <span className="rounded bg-violet-50 px-1.5 py-0.5 text-[9px] font-medium text-violet-500 dark:bg-violet-900/25 dark:text-violet-400">
              Custom
            </span>
          )}
          {isActive && topics && topics.length > 0 && (
            <svg
              className={`h-3 w-3 shrink-0 text-surface-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>
        {showReorderToggle && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleReorder(cat.slug);
            }}
            title={isReorderMode ? 'Done reordering' : 'Reorder topics'}
            aria-label={isReorderMode ? 'Done reordering' : 'Reorder topics'}
            className={`mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-800 dark:text-surface-400 dark:hover:bg-surface-700 dark:hover:text-surface-200 ${
              isReorderMode ? 'bg-surface-100 text-surface-800 dark:bg-surface-700 dark:text-surface-200' : ''
            }`}
          >
            {isReorderMode ? (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4M8 15l4 4 4-4" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Topic sub-items (only when expanded) */}
      {isExpanded && topics && topics.length > 0 && (
        <div className="ml-4 mt-0.5 space-y-px border-l border-surface-200 pl-2 dark:border-surface-700">
          {isReorderMode && hasOverride && (
            <button
              type="button"
              onClick={() => onResetOverride(cat.slug)}
              className="mb-1 flex items-center gap-1.5 px-2 py-1 text-[11px] text-surface-500 hover:text-primary-600 dark:text-surface-400 dark:hover:text-primary-400"
              title="Reset to default order"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset to default
            </button>
          )}
          {topics.map((t, i) => {
            if (isReorderMode) {
              const isFirst = i === 0;
              const isLast = i === topics.length - 1;
              const isDragging = dragIndex === i;
              const isDropTarget = overIndex === i && dragIndex !== null && dragIndex !== i;
              return (
                <div
                  key={t.slug}
                  draggable
                  onDragStart={(e) => handleDragStart(e, i)}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onDrop={(e) => handleDrop(e, i)}
                  onDragEnd={handleDragEnd}
                  className={`flex cursor-grab items-center gap-1 rounded-md px-1 py-1 text-xs text-surface-600 transition-colors active:cursor-grabbing dark:text-surface-300 ${
                    isDragging ? 'opacity-40' : ''
                  } ${
                    isDropTarget
                      ? 'ring-1 ring-primary-400 ring-inset bg-primary-50/60 dark:bg-primary-900/20'
                      : ''
                  }`}
                >
                  <svg
                    className="h-3.5 w-3.5 shrink-0 text-surface-400 dark:text-surface-500"
                    viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"
                  >
                    <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
                    <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
                    <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
                  </svg>
                  <span className="flex-1 truncate" title={t.title}>{t.title}</span>
                  <button
                    type="button"
                    onClick={() => onMoveTopic(cat.slug, i, i - 1)}
                    disabled={isFirst}
                    title="Move up"
                    aria-label={`Move ${t.title} up`}
                    className="flex h-6 w-6 items-center justify-center rounded text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-800 disabled:cursor-not-allowed disabled:opacity-30 dark:text-surface-400 dark:hover:bg-surface-700 dark:hover:text-surface-200"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveTopic(cat.slug, i, i + 1)}
                    disabled={isLast}
                    title="Move down"
                    aria-label={`Move ${t.title} down`}
                    className="flex h-6 w-6 items-center justify-center rounded text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-800 disabled:cursor-not-allowed disabled:opacity-30 dark:text-surface-400 dark:hover:bg-surface-700 dark:hover:text-surface-200"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              );
            }

            const active = t.slug === visibleSlug;
            const status = getTopicStatus(t.slug);
            const dot = statusDot[status] || statusDot['not-started'];

            return (
              <button
                key={t.slug}
                onClick={() => onTopicClick(t.slug)}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
                  active
                    ? 'bg-primary-50 font-medium text-primary-700 dark:bg-primary-900/25 dark:text-primary-300'
                    : 'text-surface-500 hover:bg-surface-50 hover:text-surface-700 dark:text-surface-400 dark:hover:bg-surface-800/50 dark:hover:text-surface-300'
                }`}
              >
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
                <span className="truncate">{t.title}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <h3 className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
      {children}
    </h3>
  );
}

function DashboardIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function GridIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

function CodeIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  );
}

function BookmarkIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );
}

function ClockIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ChartIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function PlusIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function GearIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
