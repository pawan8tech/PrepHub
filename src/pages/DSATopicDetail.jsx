import { useEffect, useCallback, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDSATopicBySlug } from '../data';
import { useRecent } from '../context/RecentContext';
import { useAuth } from '../context/AuthContext';
import { useDSAProblems } from '../context/DSAProblemContext';
import { useMergedContent } from '../hooks/useMergedContent';
import { useNotes } from '../context/NotesContext';
import { useMode } from '../context/ModeContext';
import { useMobileActions } from '../context/MobileActionsContext';
import ModeToggle from '../components/common/ModeToggle';
import BookmarkButton from '../components/common/BookmarkButton';
import ProgressBadge from '../components/common/ProgressBadge';
import SyncStatus from '../components/common/SyncStatus';
import TopicContent from '../components/topic/TopicContent';
import QuestionList from '../components/topic/QuestionList';
import RelatedTopics from '../components/topic/RelatedTopics';
import ExternalLinks from '../components/topic/ExternalLinks';
import EmptyState from '../components/common/EmptyState';

const difficultyStyles = {
  easy: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-400',
  medium: 'bg-amber-50 text-amber-700 dark:bg-amber-900/25 dark:text-amber-400',
  hard: 'bg-red-50 text-red-700 dark:bg-red-900/25 dark:text-red-400',
};

export default function DSATopicDetail() {
  const { slug } = useParams();
  const topic = getDSATopicBySlug(slug);
  const { addRecent } = useRecent();
  const { user } = useAuth();
  const { getSolvedCount, getImportantCount, getSolvedPercentage } = useDSAProblems();
  const mergedContent = useMergedContent(topic);
  const { mode } = useMode();
  const { ensurePersonalNoteCopy, getNoteSource } = useNotes();
  const { showMobileActions } = useMobileActions();
  // When the user opts in (session-only), these action buttons are revealed on
  // mobile too; otherwise they stay hidden until the sm breakpoint.
  const actionVisibility = showMobileActions ? 'inline-flex' : 'hidden sm:inline-flex';
  const [notesEditing, setNotesEditing] = useState(false);
  const topicDocRef = useRef(null);

  useEffect(() => {
    if (topic) addRecent(topic.slug);
  }, [topic, addRecent]);

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
        title="DSA topic not found"
        description={`No DSA topic matching "${slug}" was found.`}
        action={
          <Link
            to="/dsa"
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Browse DSA Topics
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-surface-400 dark:text-surface-500">
        <Link to="/dsa" className="transition-colors hover:text-primary-600 dark:hover:text-primary-400">
          DSA
        </Link>
        <ChevronIcon />
        <span className="truncate text-surface-700 dark:text-surface-300">
          {topic.title}
        </span>
      </nav>

      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
              {topic.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-400">
                🧩 DSA
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  difficultyStyles[topic.difficulty] || difficultyStyles.medium
                }`}
              >
                {topic.difficulty}
              </span>
              {user ? <SyncStatus /> : null}
            </div>
          </div>
          <BookmarkButton slug={topic.slug} />
        </div>

        {/* Actions bar */}
        <div className="flex flex-wrap items-center gap-3">
          <ModeToggle />
          <ProgressBadge slug={topic.slug} />
          {user &&
            (notesEditing ? (
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
            ))}
        </div>

        {/* Problem tracking summary */}
        {topic.questions?.length > 0 && (
          <ProblemSummary
            questions={topic.questions}
            getSolvedCount={getSolvedCount}
            getImportantCount={getImportantCount}
            getSolvedPercentage={getSolvedPercentage}
          />
        )}
      </div>

      <hr className="border-surface-200 dark:border-surface-800" />

      {/* Mode-based notes */}
      <TopicContent
        ref={topicDocRef}
        content={mergedContent}
        topicSlug={topic.slug}
        noteSource={getNoteSource(topic.slug, mode)}
        notesEditing={notesEditing}
        onNotesEditingChange={setNotesEditing}
      />

      {/* Questions table */}
      <QuestionList questions={topic.questions} />

      {/* External links */}
      <ExternalLinks links={topic.externalLinks} />

      {/* Related topics */}
      <RelatedTopics slugs={topic.relatedTopics} />
    </div>
  );
}

function ProblemSummary({ questions, getSolvedCount, getImportantCount, getSolvedPercentage }) {
  const ids = questions.map((q) => q.id);
  const solved = getSolvedCount(ids);
  const important = getImportantCount(ids);
  const percent = getSolvedPercentage(ids);
  const total = questions.length;

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-surface-200 bg-surface-50 px-4 py-2.5 dark:border-surface-800 dark:bg-surface-900">
      <div className="flex items-center gap-2">
        <span className={`flex h-5 w-5 items-center justify-center rounded border-2 ${
          solved === total
            ? 'border-emerald-500 bg-emerald-500 text-white'
            : 'border-surface-300 dark:border-surface-600'
        }`}>
          {solved === total && (
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </span>
        <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
          Solved: <span className="text-emerald-600 dark:text-emerald-400">{solved}</span> / {total}
        </span>
      </div>

      {important > 0 && (
        <div className="flex items-center gap-1.5">
          <svg className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
          <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
            Important: <span className="text-amber-600 dark:text-amber-400">{important}</span>
          </span>
        </div>
      )}

      {total > 0 && (
        <div className="ml-auto flex items-center gap-2">
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-200 dark:bg-surface-700">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="text-xs font-medium text-surface-500 dark:text-surface-400">
            {percent}%
          </span>
        </div>
      )}
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg className="h-3.5 w-3.5 shrink-0 text-surface-300 dark:text-surface-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
