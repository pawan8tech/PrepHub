import { forwardRef, useMemo } from 'react';
import { useMode } from '../../context/ModeContext';
import TopicDocument from './TopicDocument';

function blocksSeedSig(blocks) {
  if (!Array.isArray(blocks) || blocks.length === 0) return '0';
  return `${blocks.length}:${blocks.map((b) => String(b?.id ?? '')).join(',')}`;
}

const TopicContent = forwardRef(function TopicContent(
  { content, topicSlug, noteSource, notesEditing, onNotesEditingChange },
  ref,
) {
  const { mode } = useMode();
  const data = mode === 'learning' ? content?.learning : content?.interview;
  const topicBlocks = Array.isArray(data?.blocks) ? data.blocks : [];

  const blocksSig = blocksSeedSig(topicBlocks);
  const editorSeedKey = useMemo(
    () => `${noteSource ?? ''}|${mode}|${blocksSig}`,
    [noteSource, mode, blocksSig],
  );

  return (
    <TopicDocument
      ref={ref}
      topicBlocks={topicBlocks}
      topicSlug={topicSlug}
      mode={mode}
      editorSeedKey={editorSeedKey}
      notesEditing={notesEditing}
      onNotesEditingChange={onNotesEditingChange}
    />
  );
});

export default TopicContent;
