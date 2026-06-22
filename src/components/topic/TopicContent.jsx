import { forwardRef } from 'react';
import { useMode } from '../../context/ModeContext';
import TopicDocument from './TopicDocument';

const TopicContent = forwardRef(function TopicContent(
  { content, topicSlug, notesEditing, onNotesEditingChange, onAddTopic },
  ref,
) {
  const { mode } = useMode();
  const data = mode === 'learning' ? content?.learning : content?.interview;
  const topicBlocks = Array.isArray(data?.blocks) ? data.blocks : [];

  return (
    <TopicDocument
      ref={ref}
      topicBlocks={topicBlocks}
      topicSlug={topicSlug}
      mode={mode}
      notesEditing={notesEditing}
      onNotesEditingChange={onNotesEditingChange}
      onAddTopic={onAddTopic}
    />
  );
});

export default TopicContent;
