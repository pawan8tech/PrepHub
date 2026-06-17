import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useAllCategories } from '../hooks/useAllCategories';
import { useAllContent } from '../hooks/useAllContent';
import { useNotes } from '../context/NotesContext';
import { useTopicOrder } from '../context/TopicOrderContext';
import { useAuth } from '../context/AuthContext';
import { downloadCategoryPdf } from '../utils/pdfExport';
import TopicBlock from '../components/topic/TopicBlock';
import EmptyState from '../components/common/EmptyState';
import AdminBulkImport from '../components/admin/AdminBulkImport';
import AdminReorderJson from '../components/admin/AdminReorderJson';

export default function CategoryTopics() {
  const { slug } = useParams();
  const location = useLocation();
  const { getCategoryBySlug } = useAllCategories();
  const category = getCategoryBySlug(slug);
  const { getTopicsByCategory } = useAllContent();
  const { applyOrder } = useTopicOrder();
  const rawTopics = getTopicsByCategory(slug);
  const topics = useMemo(() => applyOrder(slug, rawTopics), [applyOrder, slug, rawTopics]);
  const { getUserNotes } = useNotes();
  const { isAdmin } = useAuth();
  const [filter, setFilter] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showReorderJson, setShowReorderJson] = useState(false);
  const headerRef = useRef(null);

  const handleDownloadPdf = async () => {
    if (pdfLoading || topics.length === 0) return;
    setPdfLoading(true);
    try {
      await downloadCategoryPdf(category.title, topics, getUserNotes);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setPdfLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!filter) return topics;
    const q = filter.toLowerCase();
    return topics.filter((t) => t.title.toLowerCase().includes(q));
  }, [topics, filter]);

  // Scroll to a specific topic if hash is present (e.g. #topic-closures)
  useEffect(() => {
    const hash = location.hash;
    if (!hash) return;
    const id = hash.slice(1);
    const timer = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    return () => clearTimeout(timer);
  }, [location.hash]);

  // Broadcast visible topic slugs for sidebar scroll spy
  useEffect(() => {
    const nodes = document.querySelectorAll('[data-topic-slug]');
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            window.dispatchEvent(
              new CustomEvent('topic-visible', {
                detail: entry.target.dataset.topicSlug,
              }),
            );
          }
        }
      },
      { rootMargin: '-20% 0px -60% 0px' },
    );

    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [filtered]);

  if (!category) {
    return (
      <EmptyState
        icon="🔍"
        title="Category not found"
        description={`No category matching "${slug}" was found.`}
        action={
          <Link
            to="/categories"
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Browse Categories
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Sticky header */}
      <div
        ref={headerRef}
        className="sticky top-14 z-10 -mx-4 bg-surface-50/95 px-4 py-3 backdrop-blur-sm dark:bg-surface-950/95 sm:-mx-6 sm:px-6"
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg"
            style={{ backgroundColor: `${category.color}15` }}
          >
            {category.icon}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-surface-900 dark:text-white">
              {category.title}
            </h1>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              {topics.length} topic{topics.length !== 1 && 's'}
            </p>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowBulkImport(true)}
              className="hidden shrink-0 items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/30 sm:inline-flex"
              title="Bulk import topics from JSON"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 4H7a2 2 0 00-2 2v3a2 2 0 01-2 2v2a2 2 0 012 2v3a2 2 0 002 2h1m8-16h1a2 2 0 012 2v3a2 2 0 002 2v2a2 2 0 00-2 2v3a2 2 0 01-2 2h-1" />
              </svg>
              Bulk JSON
            </button>
          )}
          {isAdmin && topics.length > 1 && (
            <button
              type="button"
              onClick={() => setShowReorderJson(true)}
              className="hidden shrink-0 items-center gap-1.5 rounded-lg border border-violet-300 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 transition-colors hover:bg-violet-100 dark:border-violet-700 dark:bg-violet-900/20 dark:text-violet-300 dark:hover:bg-violet-900/30 sm:inline-flex"
              title="Reorder topics from a JSON list"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h13M3 12h9M3 17h5m9-9l4 4-4 4" />
              </svg>
              Reorder JSON
            </button>
          )}
          {topics.length > 0 && (
            <button
              onClick={handleDownloadPdf}
              disabled={pdfLoading}
              className="hidden shrink-0 items-center gap-1.5 rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-xs font-medium text-surface-600 transition-colors hover:border-primary-300 hover:text-primary-600 disabled:opacity-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:border-primary-600 dark:hover:text-primary-400 sm:inline-flex"
              title="Download all topics as PDF"
            >
              {pdfLoading ? (
                <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              {pdfLoading ? 'Generating...' : 'PDF'}
            </button>
          )}

          {topics.length > 4 && (
            <div className="relative hidden sm:block">
              <svg className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter..."
                className="h-8 w-44 rounded-lg border border-surface-200 bg-white pl-8 pr-3 text-xs text-surface-800 placeholder-surface-400 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200 dark:placeholder-surface-500 dark:focus:border-primary-600 dark:focus:ring-primary-900/30"
              />
            </div>
          )}
        </div>

        {/* Mobile filter + download */}
        <div className="mt-2 flex gap-2 sm:hidden">
          {topics.length > 4 && (
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder={`Filter ${category.title} topics...`}
                className="h-9 w-full rounded-lg border border-surface-200 bg-white pl-9 pr-3 text-sm text-surface-800 placeholder-surface-400 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200 dark:placeholder-surface-500 dark:focus:border-primary-600 dark:focus:ring-primary-900/30"
              />
            </div>
          )}
          {topics.length > 0 && (
            <button
              onClick={handleDownloadPdf}
              disabled={pdfLoading}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-surface-200 bg-white px-3 text-xs font-medium text-surface-600 hover:border-primary-300 hover:text-primary-600 disabled:opacity-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:border-primary-600 dark:hover:text-primary-400"
              title="Download PDF"
            >
              {pdfLoading ? (
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              PDF
            </button>
          )}
        </div>
      </div>

      {/* All topics rendered inline */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="📝"
          title={filter ? 'No matching topics' : 'No topics yet'}
          description={
            filter
              ? `No topics matching "${filter}" in ${category.title}.`
              : `Topics for ${category.title} will appear here once content is added.`
          }
        />
      ) : (
        <div className="space-y-6">
          {filtered.map((topic) => (
            <TopicBlock key={topic.slug} topic={topic} />
          ))}
        </div>
      )}

      {isAdmin && showBulkImport ? (
        <AdminBulkImport
          defaultCategory={slug}
          onClose={() => setShowBulkImport(false)}
        />
      ) : null}

      {isAdmin && showReorderJson ? (
        <AdminReorderJson
          defaultCategory={slug}
          onClose={() => setShowReorderJson(false)}
        />
      ) : null}
    </div>
  );
}
