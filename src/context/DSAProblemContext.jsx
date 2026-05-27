import { createContext, useContext, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const DSAProblemContext = createContext();

export function DSAProblemProvider({ children }) {
  const [meta, setMeta] = useLocalStorage('prephub-dsa-problem-meta', {});

  const getMeta = useCallback(
    (id) => meta[id] || { done: false, important: false },
    [meta]
  );

  const toggleProblemDone = useCallback(
    (id) => {
      setMeta((prev) => {
        const current = prev[id] || { done: false, important: false };
        return { ...prev, [id]: { ...current, done: !current.done } };
      });
    },
    [setMeta]
  );

  const toggleProblemImportant = useCallback(
    (id) => {
      setMeta((prev) => {
        const current = prev[id] || { done: false, important: false };
        return { ...prev, [id]: { ...current, important: !current.important } };
      });
    },
    [setMeta]
  );

  const isProblemDone = useCallback((id) => getMeta(id).done, [getMeta]);
  const isProblemImportant = useCallback((id) => getMeta(id).important, [getMeta]);

  const getSolvedCount = useCallback(
    (ids) => ids.filter((id) => (meta[id]?.done)).length,
    [meta]
  );

  const getImportantCount = useCallback(
    (ids) => ids.filter((id) => (meta[id]?.important)).length,
    [meta]
  );

  const getSolvedPercentage = useCallback(
    (ids) => (ids.length === 0 ? 0 : Math.round((getSolvedCount(ids) / ids.length) * 100)),
    [getSolvedCount]
  );

  return (
    <DSAProblemContext.Provider
      value={{
        toggleProblemDone,
        toggleProblemImportant,
        isProblemDone,
        isProblemImportant,
        getSolvedCount,
        getImportantCount,
        getSolvedPercentage,
      }}
    >
      {children}
    </DSAProblemContext.Provider>
  );
}

export function useDSAProblems() {
  const context = useContext(DSAProblemContext);
  if (!context)
    throw new Error('useDSAProblems must be used within DSAProblemProvider');
  return context;
}
