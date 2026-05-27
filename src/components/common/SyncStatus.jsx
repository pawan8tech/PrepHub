import { useState } from 'react';
import { useNotes } from '../../context/NotesContext';

const STATUS_CONFIG = {
  saving: {
    icon: SpinnerIcon,
    text: 'Saving...',
    tooltip: 'Saving your changes...',
    color: 'text-primary-600 dark:text-primary-400',
    bg: 'bg-primary-50 dark:bg-primary-900/20',
  },
  saved: {
    icon: CheckIcon,
    text: 'Saved ✓',
    tooltip: 'All changes saved successfully.',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
  },
  syncing: {
    icon: SyncIcon,
    text: 'Syncing...',
    tooltip: 'Syncing queued changes with server...',
    color: 'text-primary-600 dark:text-primary-400',
    bg: 'bg-primary-50 dark:bg-primary-900/20',
  },
  pending: {
    icon: CloudOffIcon,
    text: 'Queued',
    tooltip: 'Changes saved locally. Waiting to sync with server.',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
  },
  offline: {
    icon: OfflineIcon,
    text: 'Offline (queued)',
    tooltip: 'You are offline. Changes will sync when connection is restored.',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
  },
  error: {
    icon: ErrorIcon,
    text: 'Error',
    tooltip: 'Failed to save. Click to retry.',
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
    clickable: true,
  },
};

function resolveState(saveStatus, syncing, pendingCount, online) {
  if (saveStatus === 'saving') return 'saving';
  if (saveStatus === 'error') return 'error';
  if (syncing) return 'syncing';
  if (saveStatus === 'saved' && pendingCount === 0) return 'saved';
  if (!online && pendingCount > 0) return 'offline';
  if (pendingCount > 0) return 'pending';
  if (saveStatus === 'saved') return 'saved';
  if (!online) return 'offline';
  return null;
}

export default function SyncStatus() {
  const { saveStatus, syncing, pendingCount, online, retrySave } = useNotes();
  const [showTooltip, setShowTooltip] = useState(false);

  const state = resolveState(saveStatus, syncing, pendingCount, online);
  if (!state) return null;

  const config = STATUS_CONFIG[state];
  const IconComponent = config.icon;

  const handleClick = () => {
    if (config.clickable && retrySave) {
      retrySave();
    }
  };

  const pendingLabel = state === 'pending' || state === 'offline'
    ? ` (${pendingCount})`
    : '';

  return (
    <div className="relative inline-flex">
      <div
        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium ${config.color} ${config.bg} ${config.clickable ? 'cursor-pointer hover:opacity-80' : ''} transition-opacity`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={handleClick}
        role={config.clickable ? 'button' : undefined}
        tabIndex={config.clickable ? 0 : undefined}
      >
        <IconComponent className="h-3.5 w-3.5" />
        <span>{config.text}{pendingLabel}</span>
      </div>

      {showTooltip && (
        <div className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-surface-200 bg-white px-3 py-2 text-xs text-surface-700 shadow-lg dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300">
          {config.tooltip}
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-white dark:border-t-surface-800" />
        </div>
      )}
    </div>
  );
}

// ── Icons ────────────────────────────────────────────────────────────

function SpinnerIcon({ className }) {
  return (
    <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function CheckIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function SyncIcon({ className }) {
  return (
    <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function CloudOffIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function OfflineIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a5 5 0 01-.354-7.065M3 3l18 18" />
    </svg>
  );
}

function ErrorIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}
