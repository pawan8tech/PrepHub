import { useMode } from '../../context/ModeContext';

export default function ModeToggle({ compact = false }) {
  const { mode, toggleMode } = useMode();
  const isLearning = mode === 'learning';

  if (compact) {
    return (
      <button
        onClick={toggleMode}
        className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors hover:bg-surface-100 dark:hover:bg-surface-800"
        aria-label={`Switch to ${isLearning ? 'interview' : 'learning'} mode`}
      >
        <span className={isLearning ? 'text-primary-600 dark:text-primary-400' : 'text-amber-600 dark:text-amber-400'}>
          {isLearning ? '📖' : '🎯'}
        </span>
        <span className="text-surface-600 dark:text-surface-400">
          {isLearning ? 'Learn' : 'Interview'}
        </span>
      </button>
    );
  }

  return (
    <div className="flex items-center rounded-lg bg-surface-100 p-0.5 dark:bg-surface-800">
      <button
        onClick={() => !isLearning && toggleMode()}
        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
          isLearning
            ? 'bg-white text-primary-700 shadow-sm dark:bg-surface-700 dark:text-primary-400'
            : 'text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200'
        }`}
      >
        📖 Learning
      </button>
      <button
        onClick={() => isLearning && toggleMode()}
        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
          !isLearning
            ? 'bg-white text-amber-700 shadow-sm dark:bg-surface-700 dark:text-amber-400'
            : 'text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200'
        }`}
      >
        🎯 Interview
      </button>
    </div>
  );
}
