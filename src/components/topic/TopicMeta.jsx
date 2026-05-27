import { getCategoryBySlug } from '../../data';

export default function TopicMeta({ topic }) {
  const category = getCategoryBySlug(topic.category);

  if (!category) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className="rounded-md px-2 py-0.5 text-xs font-medium"
        style={{
          backgroundColor: `${category.color}15`,
          color: category.color,
        }}
      >
        {category.icon} {category.title}
      </span>
    </div>
  );
}
