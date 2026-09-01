import { useEffect, useCallback, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getTopicBySlug } from '../data';
import { useRecent } from '../context/RecentContext';
import { useAllCategories } from '../hooks/useAllCategories';
import { useMergedContent } from '../hooks/useMergedContent';
import { useNotes } from '../context/NotesContext';
import { useMode } from '../context/ModeContext';
import { useAuth } from '../context/AuthContext';
import { useIdleExitEdit } from '../hooks/useIdleExitEdit';
import TopicMenu from '../components/common/TopicMenu';
import TopicContent from '../components/topic/TopicContent';
import TopicBlock from '../components/topic/TopicBlock';
import NewTopicInline from '../components/topic/NewTopicInline';
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
  const { getNoteTopic, updateModeDocument, deleteTopic, renameTopic } = useNotes();
  const noteTopic = getNoteTopic(slug);
  const topic = staticTopic || noteTopic;
  const { addRecent } = useRecent();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const mergedContent = useMergedContent(topic);
  const { mode } = useMode();
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [notesEditing, setNotesEditing] = useState(false);
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [createdSlugs, setCreatedSlugs] = useState([]);
  const [deleting, setDeleting] = useState(false);

  // Double-click enters edit; 30s of inactivity drops back to view.
  const exitEdit = useCallback(() => setNotesEditing(false), []);
  useIdleExitEdit(notesEditing, exitEdit);

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

  // Topic actions live inside the ⋮ menu — always available to a signed-in user.
  const menuActions = [];
  if (user) {
    menuActions.push({
      label: notesEditing ? 'View mode' : 'Edit notes',
      onClick: () => setNotesEditing((v) => !v),
      icon: notesEditing ? <EyeIcon /> : <PencilIcon />,
    });
    menuActions.push({
      label: 'Rename topic',
      onClick: () => {
        const next = window.prompt('Rename topic', topic.title);
        const t = (next || '').trim();
        if (t && t !== topic.title) renameTopic(topic.slug, t);
      },
      icon: <PencilIcon />,
    });
    menuActions.push({
      label: 'Import JSON',
      onClick: () => setShowJsonImport(true),
      icon: <BracesIcon />,
    });
    menuActions.push({
      label: deleting ? 'Deleting…' : isAdmin ? 'Delete topic' : 'Remove from my notes',
      onClick: handleDeleteTopic,
      danger: true,
      disabled: deleting,
      icon: <TrashIcon />,
    });
  }

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
            <TopicMenu slug={topic.slug} actions={menuActions} />
          </div>
        </div>

        <TopicMeta topic={topic} />

        {/* Actions bar */}
        <div className="flex flex-wrap items-center gap-3">
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

      {/* Section-based content — autosaves, idle-exits to view */}
      <TopicContent
        content={mergedContent}
        topicSlug={topic.slug}
        notesEditing={notesEditing}
        onNotesEditingChange={setNotesEditing}
        onAddTopic={() => setShowNewTopic(true)}
      />

      {/* Inline "new topic" form, opened from the `/add topic` slash command */}
      {showNewTopic ? (
        <NewTopicInline
          category={topic.category}
          afterSlug={topic.slug}
          onCreated={(slug) =>
            setCreatedSlugs((prev) => (prev.includes(slug) ? prev : [...prev, slug]))
          }
          onClose={() => setShowNewTopic(false)}
        />
      ) : null}

      {/* Topics just created from here — shown inline so they can be edited/deleted in place */}
      {createdSlugs.map((slug) => {
        const created = getNoteTopic(slug);
        return created ? <TopicBlock key={slug} topic={created} editing={notesEditing} /> : null;
      })}

      {showJsonImport ? (
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

function PencilIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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
