import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDSATopicBySlug } from '../data';
import { useRecent } from '../context/RecentContext';
import { useAuth } from '../context/AuthContext';
import { useIdleExitEdit } from '../hooks/useIdleExitEdit';
import { useDSAProblems } from '../context/DSAProblemContext';
import { useMergedContent } from '../hooks/useMergedContent';
import ModeToggle from '../components/common/ModeToggle';
import TopicMenu from '../components/common/TopicMenu';
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
  const [notesEditing, setNotesEditing] = useState(false);

  // Double-click enters edit; 30s of inactivity drops back to view.
  const exitEdit = useCallback(() => setNotesEditing(false), []);
  useIdleExitEdit(notesEditing, exitEdit);

  useEffect(() => {
    if (topic) addRecent(topic.slug);
  }, [topic, addRecent]);

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

  const menuActions = user
    ? [
        {
          label: notesEditing ? 'View mode' : 'Edit notes',
          onClick: () => setNotesEditing((v) => !v),
          icon: notesEditing ? <EyeIcon /> : <PencilIcon />,
        },
      ]
    : [];

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
          <TopicMenu slug={topic.slug} actions={menuActions} />
        </div>

        {/* Actions bar */}
        <div className="flex flex-wrap items-center gap-3">
          <ModeToggle />
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

      {/* Mode-based notes — autosaves, idle-exits to view */}
      <TopicContent
        content={mergedContent}
        topicSlug={topic.slug}
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

function ChevronIcon() {
  return (
    <svg className="h-3.5 w-3.5 shrink-0 text-surface-300 dark:text-surface-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
