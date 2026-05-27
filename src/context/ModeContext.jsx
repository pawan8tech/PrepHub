import { createContext, useContext } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const ModeContext = createContext();

export function ModeProvider({ children }) {
  const [mode, setMode] = useLocalStorage('prephub-mode', 'learning');

  const toggleMode = () =>
    setMode((m) => (m === 'learning' ? 'interview' : 'learning'));

  return (
    <ModeContext.Provider value={{ mode, setMode, toggleMode }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const context = useContext(ModeContext);
  if (!context) throw new Error('useMode must be used within ModeProvider');
  return context;
}
