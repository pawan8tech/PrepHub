/** Block editor: convert current block type (shown after typing `/`). */
export const BLOCK_CONVERT_COMMANDS = [
  { label: 'Text', value: 'text' },
  { label: 'Heading 1', value: 'h1' },
  { label: 'Heading 2', value: 'h2' },
  { label: 'Heading 3', value: 'h3' },
  { label: 'List', value: 'list' },
  { label: 'Code', value: 'code' },
  { label: 'Callout', value: 'callout' },
  { label: 'Important', value: 'important' },
  { label: 'Warning', value: 'warning' },
  { label: 'Tip', value: 'tip' },
  { label: 'Table', value: 'table' },
  { label: 'Q & A', value: 'qna' },
];

/** Action command — creates a brand new topic rather than converting/inserting a block. */
export const ADD_TOPIC_COMMAND = { label: 'Add topic', value: 'add-topic' };

export function filterBlockConvertCommands(query, options = {}) {
  const { allowQna = true, allowAddTopic = false } = options;
  let base = allowQna
    ? BLOCK_CONVERT_COMMANDS
    : BLOCK_CONVERT_COMMANDS.filter((c) => c.value !== 'qna');
  // Surface "Add topic" at the top so it's visible without scrolling the menu.
  if (allowAddTopic) base = [ADD_TOPIC_COMMAND, ...base];
  const q = (query || '').trim().toLowerCase();
  if (!q) return [...base];
  return base.filter(
    (c) =>
      c.label.toLowerCase().includes(q) ||
      c.value.toLowerCase().includes(q),
  );
}

export function removeSlashToken(text, slash) {
  if (!slash || typeof text !== 'string') return text;
  return text.slice(0, slash.start) + text.slice(slash.end);
}

/**
 * If cursor is right after a `/command` token (same line, word chars only), return range + query.
 */
export function getSlashMenuState(text, cursor) {
  if (cursor < 1 || typeof text !== 'string') return null;
  const before = text.slice(0, cursor);
  const slashIdx = before.lastIndexOf('/');
  if (slashIdx === -1) return null;

  const afterSlash = before.slice(slashIdx + 1);
  if (!/^[\w]*$/i.test(afterSlash)) return null;

  const okStart = slashIdx === 0 || /[\s\n]/.test(text[slashIdx - 1]);
  if (!okStart) return null;

  return {
    start: slashIdx,
    end: cursor,
    query: afterSlash.toLowerCase(),
  };
}
