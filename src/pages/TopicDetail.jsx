import { useEffect, useCallback, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getTopicBySlug } from '../data';
import { useRecent } from '../context/RecentContext';
import { useAllCategories } from '../hooks/useAllCategories';
import { useMergedContent } from '../hooks/useMergedContent';
import { useNotes } from '../context/NotesContext';
import { useMode } from '../context/ModeContext';
import { useAuth } from '../context/AuthContext';
import { useMobileActions } from '../context/MobileActionsContext';
import ModeToggle from '../components/common/ModeToggle';
import BookmarkButton from '../components/common/BookmarkButton';
import ProgressBadge from '../components/common/ProgressBadge';
import TopicContent from '../components/topic/TopicContent';
import TopicMeta from '../components/topic/TopicMeta';
import RelatedTopics from '../components/topic/RelatedTopics';
import ExternalLinks from '../components/topic/ExternalLinks';
import EmptyState from '../components/common/EmptyState';
import AdminJsonImport from '../components/admin/AdminJsonImport';
import SyncStatus from '../components/common/SyncStatus';

export default function TopicDetail() {
  const { slug } = useParams();
  const { getCategoryBySlug } = useAllCategories();
  const staticTopic = getTopicBySlug(slug);
  const { getNoteTopic, updateModeDocument, ensurePersonalNoteCopy, getNoteSource, deleteTopic } = useNotes();
  const noteTopic = getNoteTopic(slug);
  const topic = staticTopic || noteTopic;
  const { addRecent } = useRecent();
  const { user, isAdmin } = useAuth();
  const { showMobileActions } = useMobileActions();
  // When the user opts in (session-only), these action buttons are revealed on
  // mobile too; otherwise they stay hidden until the sm breakpoint.
  const actionVisibility = showMobileActions ? 'inline-flex' : 'hidden sm:inline-flex';
  const navigate = useNavigate();
  const mergedContent = useMergedContent(topic);
  const { mode } = useMode();
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [notesEditing, setNotesEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const topicDocRef = useRef(null);

  const handleDeleteTopic = useCallback(async () => {
    if (!topic || deleting) return;
    const label = isAdmin
      ? `Delete "${topic.title}" for everyone? This wipes the global admin notes.`
      : `Remove "${topic.title}" from your notes? Other users will still see it.`;
    if (!window.confirm(label)) return;
    setDeleting(true);
    try {
      await deleteTopic(topic.slug);
      navigate('/categories');
    } catch (err) {
      console.error('Failed to delete topic:', err);
      setDeleting(false);
    }
  }, [topic, deleting, isAdmin, deleteTopic, navigate]);

  useEffect(() => {
    if (topic) addRecent(topic.slug);
  }, [topic, addRecent]);

  const handleJsonImport = useCallback(
    async (byMode) => {
      if (!topic) return;
      for (const [m, incoming] of Object.entries(byMode)) {
        if (!Array.isArray(incoming) || incoming.length === 0) continue;
        const current = Array.isArray(mergedContent?.[m]?.blocks)
          ? mergedContent[m].blocks
          : [];
        await updateModeDocument(topic.slug, m, { blocks: [...current, ...incoming] });
      }
    },
    [topic, mergedContent, updateModeDocument],
  );

  const handleEditNotes = useCallback(async () => {
    if (!topic) return;
    try {
      await ensurePersonalNoteCopy(topic.slug, topic.title, mode, mergedContent);
    } catch (err) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('[notes-edit] ensurePersonalNoteCopy failed', err);
      }
      return;
    }
    setNotesEditing(true);
  }, [topic, mergedContent, ensurePersonalNoteCopy, mode]);

  if (!topic) {
    return (
      <EmptyState
        icon="🔍"
        title="Topic not found"
        description={`No topic matching "${slug}" was found.`}
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

  const category = getCategoryBySlug(topic.category);

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-surface-400 dark:text-surface-500">
        <Link to="/categories" className="transition-colors hover:text-primary-600 dark:hover:text-primary-400">
          Categories
        </Link>
        <ChevronIcon />
        {category && (
          <>
            <Link
              to={`/category/${category.slug}`}
              className="transition-colors hover:text-primary-600 dark:hover:text-primary-400"
            >
              {category.title}
            </Link>
            <ChevronIcon />
          </>
        )}
        <span className="truncate text-surface-700 dark:text-surface-300">
          {topic.title}
        </span>
      </nav>

      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="min-w-0 flex-1 text-[28px] font-semibold leading-tight text-surface-900 dark:text-white">
            {topic.title}
          </h1>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {user ? <SyncStatus /> : null}
            <BookmarkButton slug={topic.slug} />
          </div>
        </div>

        <TopicMeta topic={topic} />

        {/* Actions bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* <ModeToggle /> */}
          <ProgressBadge slug={topic.slug} />
          {user && (
            <>
              {notesEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => topicDocRef.current?.save?.()}
                    className={`${actionVisibility} rounded-lg border border-primary-300 bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-700 dark:border-primary-600 dark:bg-primary-500 dark:hover:bg-primary-600`}
                  >
                    Save notes
                  </button>
                  <button
                    type="button"
                    onClick={() => topicDocRef.current?.cancel?.()}
                    className={`${actionVisibility} rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-xs font-medium text-surface-700 transition-colors hover:bg-surface-50 dark:border-surface-600 dark:bg-surface-900 dark:text-surface-200 dark:hover:bg-surface-800`}
                  >
                    Cancel
                  </button>
                </>
              ) : (
              <button
                type="button"
                onClick={() => void handleEditNotes()}
                className={`${actionVisibility} rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-xs font-medium text-surface-700 transition-colors hover:border-primary-300 hover:bg-primary-50/60 hover:text-primary-700 dark:border-surface-600 dark:bg-surface-900 dark:text-surface-200 dark:hover:border-primary-700 dark:hover:bg-primary-950/30 dark:hover:text-primary-300`}
              >
                Edit notes
              </button>
              )}
              {(
                <button
                  type="button"
                  onClick={() => setShowJsonImport(true)}
                  className={`${actionVisibility} items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/30`}
                >
                  <BracesIcon />
                  Import JSON
                </button>
              )}
              <button
                type="button"
                onClick={handleDeleteTopic}
                disabled={deleting}
                className={`${actionVisibility} items-center gap-1.5 rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30`}
              >
                <TrashIcon />
                {deleting ? 'Deleting…' : isAdmin ? 'Delete topic' : 'Remove from my notes'}
              </button>
            </>
          )}
          {category && (
            <Link
              to={`/category/${category.slug}#topic-${topic.slug}`}
              className="flex items-center gap-1.5 rounded-lg border border-surface-200 px-3 py-1.5 text-xs font-medium text-surface-600 transition-colors hover:border-surface-300 hover:bg-surface-50 dark:border-surface-700 dark:text-surface-400 dark:hover:border-surface-600 dark:hover:bg-surface-800"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              View all {category.title}
            </Link>
          )}
        </div>
      </div>

      {/* Section-based content (includes editing) */}
      <TopicContent
        ref={topicDocRef}
        content={mergedContent}
        topicSlug={topic.slug}
        noteSource={getNoteSource(topic.slug, mode)}
        notesEditing={notesEditing}
        onNotesEditingChange={setNotesEditing}
      />

      {isAdmin && showJsonImport ? (
        <AdminJsonImport
          currentMode={mode}
          onAppend={handleJsonImport}
          onClose={() => setShowJsonImport(false)}
        />
      ) : null}

      {/* External links */}
      <ExternalLinks links={topic.externalLinks || []} />

      {/* Related topics */}
      <RelatedTopics slugs={topic.relatedTopics || []} />
    </div>
  );
}

function TrashIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
    </svg>
  );
}

function BracesIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 4H7a2 2 0 00-2 2v3a2 2 0 01-2 2v2a2 2 0 012 2v3a2 2 0 002 2h1m8-16h1a2 2 0 012 2v3a2 2 0 002 2v2a2 2 0 00-2 2v3a2 2 0 01-2 2h-1" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg className="h-3.5 w-3.5 shrink-0 text-surface-300 dark:text-surface-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
