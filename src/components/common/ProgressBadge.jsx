import { useState, useRef, useEffect } from 'react';
import { useProgress } from '../../context/ProgressContext';

const statuses = [
  { value: 'not-started', label: 'Not Started', dot: 'bg-surface-300 dark:bg-surface-600' },
  { value: 'learning', label: 'Learning', dot: 'bg-amber-400' },
  { value: 'revised', label: 'Revised', dot: 'bg-blue-500' },
  { value: 'completed', label: 'Completed', dot: 'bg-emerald-500' },
];

export default function ProgressBadge({ slug }) {
  const { getTopicStatus, setTopicStatus } = useProgress();
  const current = getTopicStatus(slug);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function close(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const currentStatus = statuses.find((s) => s.value === current) || statuses[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-surface-200 px-3 py-1.5 text-xs font-medium text-surface-600 transition-colors hover:border-surface-300 hover:bg-surface-50 dark:border-surface-700 dark:text-surface-400 dark:hover:border-surface-600 dark:hover:bg-surface-800"
      >
        <span className={`h-2 w-2 rounded-full ${currentStatus.dot}`} />
        {currentStatus.label}
        <svg className="h-3 w-3 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-lg border border-surface-200 bg-white py-1 shadow-lg dark:border-surface-700 dark:bg-surface-800">
          {statuses.map((s) => (
            <button
              key={s.value}
              onClick={() => {
                setTopicStatus(slug, s.value);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-surface-50 dark:hover:bg-surface-700 ${
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
        </div>
      )}
    </div>
  );
}
