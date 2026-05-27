import { createContext, useContext, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const ProgressContext = createContext();

// Status values: 'not-started' | 'learning' | 'revised' | 'completed'
export function ProgressProvider({ children }) {
  const [progress, setProgress] = useLocalStorage('prephub-progress', {});

  const setTopicStatus = useCallback(
    (slug, status) => {
      setProgress((prev) => ({ ...prev, [slug]: status }));
    },
    [setProgress]
  );

  const getTopicStatus = useCallback(
    (slug) => progress[slug] || 'not-started',
    [progress]
  );

  const clearProgress = useCallback(
    () => setProgress({}),
    [setProgress]
  );

  return (
    <ProgressContext.Provider
      value={{ progress, setTopicStatus, getTopicStatus, clearProgress }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (!context)
    throw new Error('useProgress must be used within ProgressProvider');
  return context;
}
