import { createContext, useContext, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const RecentContext = createContext();

const MAX_RECENT = 20;

export function RecentProvider({ children }) {
  const [recent, setRecent] = useLocalStorage('prephub-recent', []);

  const addRecent = useCallback(
    (slug) => {
      setRecent((prev) => {
        const filtered = prev.filter((s) => s !== slug);
        return [slug, ...filtered].slice(0, MAX_RECENT);
      });
    },
    [setRecent]
  );

  const clearRecent = useCallback(
    () => setRecent([]),
    [setRecent]
  );

  return (
    <RecentContext.Provider value={{ recent, addRecent, clearRecent }}>
      {children}
    </RecentContext.Provider>
  );
}

export function useRecent() {
  const context = useContext(RecentContext);
  if (!context)
    throw new Error('useRecent must be used within RecentProvider');
  return context;
}
