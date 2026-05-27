import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearch, getInlineTopicRoute } from '../../hooks/useSearch';

const typeBadge = {
  topic: 'bg-blue-50 text-blue-600 dark:bg-blue-900/25 dark:text-blue-400',
  dsa: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/25 dark:text-emerald-400',
  custom: 'bg-violet-50 text-violet-600 dark:bg-violet-900/25 dark:text-violet-400',
};

export default function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState('');
  const { results, grouped, isEmpty } = useSearch(query);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();

  // Flat list of all results for keyboard navigation
  const flatResults = results;

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [results]);

  const selectItem = useCallback(
    (item) => {
      onClose();
      navigate(getInlineTopicRoute(item));
    },
    [navigate, onClose]
  );

  useEffect(() => {
    if (!open) return;

    function handleKey(e) {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((i) => (i + 1) % Math.max(flatResults.length, 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((i) =>
            i <= 0 ? Math.max(flatResults.length - 1, 0) : i - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (flatResults[activeIndex]) {
            selectItem(flatResults[activeIndex]);
          }
          break;
      }
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose, flatResults, activeIndex, selectItem]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const active = listRef.current.querySelector('[data-active="true"]');
    active?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!open) return null;

  let globalIdx = -1;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh] sm:pt-[15vh]">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 flex w-full max-w-lg flex-col rounded-xl border border-surface-200 bg-white shadow-2xl dark:border-surface-700 dark:bg-surface-900">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-surface-200 px-4 dark:border-surface-700">
          <SearchIcon className="h-5 w-5 shrink-0 text-surface-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search topics, concepts, DSA..."
            className="h-12 flex-1 bg-transparent text-sm text-surface-900 placeholder-surface-400 outline-none dark:text-surface-100 dark:placeholder-surface-500"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="rounded p-0.5 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
            >
              <XIcon className="h-4 w-4" />
            </button>
          )}
          <kbd className="rounded bg-surface-100 px-1.5 py-0.5 font-mono text-[10px] text-surface-400 dark:bg-surface-800 dark:text-surface-500">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          className="max-h-[min(24rem,50vh)] overflow-y-auto overscroll-contain"
        >
          {/* No query yet */}
          {query.trim().length < 2 && (
            <div className="px-4 py-10 text-center">
              <p className="text-sm text-surface-400 dark:text-surface-500">
                Start typing to search across all topics...
              </p>
              <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-surface-400 dark:text-surface-500">
                <span className="flex items-center gap-1">
                  <kbd className="rounded bg-surface-100 px-1 py-0.5 font-mono dark:bg-surface-800">↑↓</kbd>
                  navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded bg-surface-100 px-1 py-0.5 font-mono dark:bg-surface-800">↵</kbd>
                  open
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded bg-surface-100 px-1 py-0.5 font-mono dark:bg-surface-800">esc</kbd>
                  close
                </span>
              </div>
            </div>
          )}

          {/* No results */}
          {isEmpty && (
            <div className="px-4 py-10 text-center">
              <p className="text-sm font-medium text-surface-500 dark:text-surface-400">
                No results for "{query}"
              </p>
              <p className="mt-1 text-xs text-surface-400 dark:text-surface-500">
                Try different keywords or check spelling
              </p>
            </div>
          )}

          {/* Grouped results */}
          {grouped.length > 0 && (
            <div className="p-2">
              {grouped.map((group) => (
                <div key={group.category} className="mb-1 last:mb-0">
                  <div className="flex items-center gap-2 px-2 py-1.5">
                    <span className="text-xs">{group.icon}</span>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
                      {group.label}
                    </span>
                    <span className="text-[10px] text-surface-300 dark:text-surface-600">
                      {group.items.length}
                    </span>
                  </div>

                  {group.items.map((item) => {
                    globalIdx++;
                    const idx = globalIdx;
                    const isActive = idx === activeIndex;

                    return (
                      <button
                        key={item.id}
                        data-active={isActive}
                        onClick={() => selectItem(item)}
                        onMouseEnter={() => setActiveIndex(idx)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                          isActive
                            ? 'bg-primary-50 dark:bg-primary-900/25'
                            : 'hover:bg-surface-50 dark:hover:bg-surface-800/50'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p
                              className={`truncate text-sm font-medium ${
                                isActive
                                  ? 'text-primary-700 dark:text-primary-300'
                                  : 'text-surface-800 dark:text-surface-200'
                              }`}
                            >
                              <Highlight text={item.title} query={query} />
                            </p>
                            {item.type && (
                              <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${typeBadge[item.type] || typeBadge.topic}`}>
                                {item.type === 'custom' ? 'Custom' : item.type === 'dsa' ? 'DSA' : 'Topic'}
                              </span>
                            )}
                          </div>
                          {item.matchedHeading && (
                            <p className="mt-0.5 truncate text-[11px] text-surface-500 dark:text-surface-400">
                              <span className="mr-1 text-surface-300 dark:text-surface-600">›</span>
                              <Highlight text={item.matchedHeading} query={query} />
                            </p>
                          )}
                          {item.snippet && (
                            <p className="mt-0.5 line-clamp-1 text-[11px] text-surface-400 dark:text-surface-500">
                              <Highlight text={item.snippet} query={query} />
                            </p>
                          )}
                        </div>

                        {isActive && (
                          <kbd className="shrink-0 rounded bg-surface-200 px-1.5 py-0.5 font-mono text-[10px] text-surface-400 dark:bg-surface-700 dark:text-surface-500">
                            ↵
                          </kbd>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}

              <div className="mt-1 border-t border-surface-100 px-3 py-2 text-center text-[11px] text-surface-400 dark:border-surface-800 dark:text-surface-500">
                {results.length} result{results.length !== 1 && 's'} found
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Highlight({ text, query }) {
  if (!text) return null;
  const q = (query || '').trim();
  if (q.length < 2) return text;
  const lc = text.toLowerCase();
  const needle = q.toLowerCase();
  const idx = lc.indexOf(needle);
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-amber-200/70 px-0.5 text-surface-900 dark:bg-amber-300/30 dark:text-amber-100">
        {text.slice(idx, idx + needle.length)}
      </mark>
      {text.slice(idx + needle.length)}
    </>
  );
}

function SearchIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function XIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
