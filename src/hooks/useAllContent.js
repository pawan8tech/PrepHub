import { useMemo } from 'react';
import { allTopics, allDSATopics } from '../data';
import { useNotes } from '../context/NotesContext';
import { blocksToPlainText } from '../utils/documentContent';

const SCORE = {
  TITLE_EXACT: 100,
  TITLE_STARTS: 70,
  TITLE_INCLUDES: 40,
  HEADING_EXACT: 35,
  HEADING_INCLUDES: 22,
  CONTENT_INCLUDES: 8,
  TITLE_WORD: 6,
  HEADING_WORD: 4,
  CONTENT_WORD: 2,
  CUSTOM_BIAS: 1,
};

const SNIPPET_RADIUS = 36;

function getType(item) {
  if (item.isCustom) return 'custom';
  if (item.category === 'dsa') return 'dsa';
  return 'topic';
}

function collectHeadings(blocks) {
  if (!Array.isArray(blocks)) return [];
  const out = [];
  for (const b of blocks) {
    if (!b || b.type !== 'heading') continue;
    const text = typeof b.content === 'string' ? b.content.trim() : '';
    if (text) out.push(text);
  }
  return out;
}

function buildIndex(item, notes) {
  const noteEntry = notes[item.slug];
  const learningBlocks = noteEntry?.learning?.document?.blocks || [];
  const interviewBlocks = noteEntry?.interview?.document?.blocks || [];

  const headings = [
    ...collectHeadings(learningBlocks),
    ...collectHeadings(interviewBlocks),
  ];
  const content = `${blocksToPlainText(learningBlocks)} ${blocksToPlainText(
    interviewBlocks,
  )}`.trim();

  const title = item.title || '';
  return {
    title,
    titleLC: title.toLowerCase(),
    headings,
    headingsLC: headings.map((h) => h.toLowerCase()),
    content,
    contentLC: content.toLowerCase(),
  };
}

function makeSnippet(content, query) {
  if (!content || !query) return null;
  const idx = content.toLowerCase().indexOf(query);
  if (idx < 0) return null;
  const start = Math.max(0, idx - SNIPPET_RADIUS);
  const end = Math.min(content.length, idx + query.length + SNIPPET_RADIUS);
  let snippet = content.slice(start, end).replace(/\s+/g, ' ').trim();
  if (start > 0) snippet = `… ${snippet}`;
  if (end < content.length) snippet = `${snippet} …`;
  return snippet;
}

export function useAllContent() {
  const { notes, noteTopics } = useNotes();

  return useMemo(() => {
    const merged = [...allTopics, ...noteTopics];
    const mergedAll = [...merged, ...allDSATopics];

    const indexBySlug = new Map();
    for (const item of mergedAll) {
      indexBySlug.set(item.slug, buildIndex(item, notes));
    }

    return {
      allTopics: merged,
      allDSATopics,
      allContent: mergedAll,

      getTopicsByCategory(categorySlug) {
        const slug = (categorySlug || '').toLowerCase();
        return merged.filter((t) => (t.category || '').toLowerCase() === slug);
      },

      searchContent(query) {
        if (!query || query.trim().length === 0) return [];

        const q = query.toLowerCase().trim();
        const words = q.split(/\s+/).filter((w) => w.length >= 2);

        const out = [];

        for (const item of mergedAll) {
          const idx = indexBySlug.get(item.slug);
          if (!idx) continue;

          let score = 0;

          if (idx.titleLC === q) score += SCORE.TITLE_EXACT;
          else if (idx.titleLC.startsWith(q)) score += SCORE.TITLE_STARTS;
          else if (idx.titleLC.includes(q)) score += SCORE.TITLE_INCLUDES;

          let matchedHeading = null;
          for (let i = 0; i < idx.headingsLC.length; i++) {
            const h = idx.headingsLC[i];
            if (h === q) {
              score += SCORE.HEADING_EXACT;
              if (!matchedHeading) matchedHeading = idx.headings[i];
            } else if (h.includes(q)) {
              score += SCORE.HEADING_INCLUDES;
              if (!matchedHeading) matchedHeading = idx.headings[i];
            }
          }

          let snippet = null;
          if (idx.contentLC.includes(q)) {
            score += SCORE.CONTENT_INCLUDES;
            snippet = makeSnippet(idx.content, q);
          }

          for (const w of words) {
            if (idx.titleLC.includes(w)) score += SCORE.TITLE_WORD;
            for (const h of idx.headingsLC) {
              if (h.includes(w)) {
                score += SCORE.HEADING_WORD;
                break;
              }
            }
            if (idx.contentLC.includes(w)) score += SCORE.CONTENT_WORD;
          }

          if (item.isCustom && score > 0) score += SCORE.CUSTOM_BIAS;

          if (score > 0) {
            out.push({
              ...item,
              type: getType(item),
              _score: score,
              matchedHeading,
              snippet,
            });
          }
        }

        return out.sort((a, b) => b._score - a._score);
      },
    };
  }, [noteTopics, notes]);
}
