import { useMemo } from 'react';
import { useNotes } from '../context/NotesContext';

/**
 * Static topic slice → document shape (for AI merge / legacy helpers only).
 */
export function learningStaticBase(learning) {
  return { blocks: Array.isArray(learning?.blocks) ? learning.blocks : [] };
}

export function interviewStaticBase(interview) {
  return { blocks: Array.isArray(interview?.blocks) ? interview.blocks : [] };
}

/** Per-mode flat `blocks` from merged Firebase notes (admin default + user override). */
export function useMergedContent(topic) {
  const { getUserNotes } = useNotes();

  return useMemo(() => {
    if (!topic) return null;

    const current = getUserNotes(topic.slug) || {};
    const learningBlocks = Array.isArray(current?.learning?.document?.blocks)
      ? current.learning.document.blocks
      : [];
    const interviewBlocks = Array.isArray(current?.interview?.document?.blocks)
      ? current.interview.document.blocks
      : [];

    return {
      learning: {
        blocks: learningBlocks,
      },
      interview: {
        blocks: interviewBlocks,
      },
      self: current?.self || {},
    };
  }, [topic, getUserNotes]);
}
