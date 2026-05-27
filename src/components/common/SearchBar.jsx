import { useState, useRef } from 'react';

export default function SearchBar({ onOpen }) {
  return (
    <button
      onClick={onOpen}
      className="flex h-9 w-full max-w-xs items-center gap-2 rounded-lg border border-surface-200 bg-surface-50 px-3 text-sm text-surface-400 transition-colors hover:border-surface-300 hover:bg-white dark:border-surface-700 dark:bg-surface-800/50 dark:text-surface-500 dark:hover:border-surface-600 dark:hover:bg-surface-800 lg:max-w-sm"
    >
      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <span className="truncate">Search topics...</span>
      <kbd className="ml-auto hidden rounded bg-surface-200 px-1.5 py-0.5 font-mono text-[10px] text-surface-500 dark:bg-surface-700 dark:text-surface-400 sm:inline-block">
        Ctrl K
      </kbd>
    </button>
  );
}
