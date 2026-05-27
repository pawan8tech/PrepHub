import { useBookmarks } from '../../context/BookmarkContext';

export default function BookmarkButton({ slug, size = 'md' }) {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const active = isBookmarked(slug);

  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-9 w-9',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
  };

  return (
    <button
      onClick={() => toggleBookmark(slug)}
      className={`flex ${sizes[size]} items-center justify-center rounded-lg transition-colors ${
        active
          ? 'bg-amber-50 text-amber-500 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30'
          : 'text-surface-400 hover:bg-surface-100 hover:text-surface-600 dark:text-surface-500 dark:hover:bg-surface-800 dark:hover:text-surface-300'
      }`}
      aria-label={active ? 'Remove bookmark' : 'Add bookmark'}
      title={active ? 'Remove bookmark' : 'Bookmark this topic'}
    >
      <svg
        className={iconSizes[size]}
        fill={active ? 'currentColor' : 'none'}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    </button>
  );
}
