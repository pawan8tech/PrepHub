import { useState, useRef, useEffect } from 'react';
import { useProgress } from '../../context/ProgressContext';
import { useBookmarks } from '../../context/BookmarkContext';

const statuses = [
  { value: 'not-started', label: 'Not Started', dot: 'bg-surface-300 dark:bg-surface-600' },
  { value: 'learning', label: 'Learning', dot: 'bg-amber-400' },
  { value: 'revised', label: 'Revised', dot: 'bg-blue-500' },
  { value: 'completed', label: 'Completed', dot: 'bg-emerald-500' },
];

/**
 * Kebab (⋮) menu shown where the bookmark button used to be. Groups the topic's
 * progress status and bookmark toggle into a single dropdown. Callers can pass
 * `actions` (e.g. Import JSON / Delete, gated by edit mode) to append more items.
 *
 * actions: Array<{ label, onClick, icon?, danger?, disabled? }>
 */
export default function TopicMenu({ slug, size = 'md', actions = [], onOpenChange }) {
  const { getTopicStatus, setTopicStatus } = useProgress();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function close(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  // Let the host (e.g. a sticky card header) raise its z-index while the menu is open
  // so the dropdown isn't covered by neighbouring sticky headers.
  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  const current = getTopicStatus(slug);
  const bookmarked = isBookmarked(slug);
  const btnSize = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Topic actions"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Progress & bookmark"
        className={`flex ${btnSize} items-center justify-center rounded-lg transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-800 dark:hover:text-surface-300 ${
          open
            ? 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-300'
            : 'text-surface-400 dark:text-surface-500'
        }`}
      >
        <svg className={iconSize} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="5" r="1.75" />
          <circle cx="12" cy="12" r="1.75" />
          <circle cx="12" cy="19" r="1.75" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 w-44 rounded-lg border border-surface-200 bg-white py-1 shadow-lg dark:border-surface-700 dark:bg-surface-800"
        >
          <div className="px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
            Progress
          </div>
          {statuses.map((s) => (
            <button
              key={s.value}
              type="button"
              role="menuitemradio"
              aria-checked={current === s.value}
              onClick={() => {
                setTopicStatus(slug, s.value);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors hover:bg-surface-50 dark:hover:bg-surface-700 ${
                current === s.value
                  ? 'font-medium text-surface-900 dark:text-surface-100'
                  : 'text-surface-600 dark:text-surface-400'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${s.dot}`} />
              {s.label}
              {current === s.value && (
                <svg className="ml-auto h-3.5 w-3.5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}

          <div className="my-1 border-t border-surface-100 dark:border-surface-700" />

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              toggleBookmark(slug);
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-surface-600 transition-colors hover:bg-surface-50 dark:text-surface-400 dark:hover:bg-surface-700"
          >
            <svg
              className={`h-3.5 w-3.5 ${bookmarked ? 'text-amber-500' : ''}`}
              fill={bookmarked ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            {bookmarked ? 'Remove bookmark' : 'Bookmark'}
          </button>

          {actions.length > 0 && (
            <>
              <div className="my-1 border-t border-surface-100 dark:border-surface-700" />
              {actions.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  role="menuitem"
                  disabled={a.disabled}
                  onClick={() => {
                    setOpen(false);
                    a.onClick?.();
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors disabled:opacity-50 ${
                    a.danger
                      ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
                      : 'text-surface-600 hover:bg-surface-50 dark:text-surface-400 dark:hover:bg-surface-700'
                  }`}
                >
                  {a.icon}
                  {a.label}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
