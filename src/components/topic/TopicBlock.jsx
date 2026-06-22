import { useEffect, useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { useRecent } from '../../context/RecentContext';
import { useAuth } from '../../context/AuthContext';
import { useMergedContent } from '../../hooks/useMergedContent';
import { useNotes } from '../../context/NotesContext';
import { useMode } from '../../context/ModeContext';
import TopicMenu from '../common/TopicMenu';
import SyncStatus from '../common/SyncStatus';
import TopicContent from './TopicContent';
import ExternalLinks from './ExternalLinks';
import NewTopicInline from './NewTopicInline';
import AdminJsonImport from '../admin/AdminJsonImport';

export default function TopicBlock({ topic, editing = false }) {
  const { addRecent } = useRecent();
  const { user, isAdmin } = useAuth();
  const mergedContent = useMergedContent(topic);
  const { updateModeDocument, deleteTopic } = useNotes();
  const { mode } = useMode();
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleDeleteTopic = useCallback(async () => {
    if (!topic || deleting) return;
    const label = isAdmin
      ? `Delete "${topic.title}" for everyone? This wipes the global admin notes.`
      : `Remove "${topic.title}" from your notes? Other users will still see it.`;
    if (!window.confirm(label)) return;
    setDeleting(true);
    try {
      await deleteTopic(topic.slug);
    } catch (err) {
      console.error('Failed to delete topic:', err);
      setDeleting(false);
    }
  }, [topic, deleting, isAdmin, deleteTopic]);

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

  useEffect(() => {
    if (topic) addRecent(topic.slug);
  }, [topic, addRecent]);

  if (!topic || !mergedContent) return null;

  // Topic actions live inside the ⋮ menu — always available to a signed-in user.
  const menuActions = [];
  if (user) {
    menuActions.push({
      label: 'Import JSON',
      onClick: () => setShowJsonImport(true),
      icon: (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 4H7a2 2 0 00-2 2v3a2 2 0 01-2 2v2a2 2 0 012 2v3a2 2 0 002 2h1m8-16h1a2 2 0 012 2v3a2 2 0 002 2v2a2 2 0 00-2 2v3a2 2 0 01-2 2h-1" />
        </svg>
      ),
    });
    menuActions.push({
      label: deleting ? 'Deleting…' : isAdmin ? 'Delete topic' : 'Remove from my notes',
      onClick: handleDeleteTopic,
      danger: true,
      disabled: deleting,
      icon: (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
        </svg>
      ),
    });
  }

  return (
    <article
      id={`topic-${topic.slug}`}
      data-topic-slug={topic.slug}
      className="scroll-mt-20 rounded-xl border border-surface-200 bg-white p-5 dark:border-surface-800 dark:bg-surface-900 sm:p-6"
    >
      {/* Header — sticks below the page's category banner while scrolling through the topic.
          Raise z-index while the ⋮ menu is open so its dropdown clears neighbouring sticky headers. */}
      <div className={`sticky top-28 mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-surface-200 bg-white py-2 dark:border-surface-800 dark:bg-surface-900 ${menuOpen ? 'z-40' : 'z-10'}`}>
        <div className="min-w-0 flex-1">
          <Link
            to={`/topic/${topic.slug}`}
            className="text-2xl font-bold text-surface-900 hover:text-primary-600 dark:text-white dark:hover:text-primary-400 sm:text-2xl"
          >
            {topic.title}
          </Link>
          {user ? (
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <SyncStatus />
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <TopicMenu slug={topic.slug} size="sm" actions={menuActions} onOpenChange={setMenuOpen} />
        </div>
      </div>

      {/* Topic notes — editable only when the category is in edit mode (autosaves) */}
      <TopicContent
        content={mergedContent}
        topicSlug={topic.slug}
        notesEditing={user ? editing : false}
        onNotesEditingChange={() => {}}
        onAddTopic={() => setShowNewTopic(true)}
      />

      {/* Inline "new topic" form, opened from the `/add topic` slash command */}
      {showNewTopic ? (
        <NewTopicInline
          category={topic.category}
          afterSlug={topic.slug}
          onClose={() => setShowNewTopic(false)}
        />
      ) : null}

      {showJsonImport ? (
        <AdminJsonImport
          currentMode={mode}
          onAppend={handleJsonImport}
          onClose={() => setShowJsonImport(false)}
        />
      ) : null}

      {/* External links */}
      {(topic.externalLinks?.length > 0) && (
        <div className="mt-6">
          <ExternalLinks links={topic.externalLinks} />
        </div>
      )}
    </article>
  );
}
