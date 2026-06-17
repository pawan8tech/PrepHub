import { createContext, useContext, useState } from 'react';

const MobileActionsContext = createContext();

/**
 * Controls whether action buttons that are normally desktop-only
 * (Bulk JSON, Reorder JSON, PDF, etc.) are also shown in mobile view.
 *
 * This preference is intentionally NOT persisted — it lives in memory
 * for the current session only and resets when the app reloads.
 */
export function MobileActionsProvider({ children }) {
  const [showMobileActions, setShowMobileActions] = useState(false);

  const toggleMobileActions = () => setShowMobileActions((v) => !v);

  return (
    <MobileActionsContext.Provider
      value={{ showMobileActions, setShowMobileActions, toggleMobileActions }}
    >
      {children}
    </MobileActionsContext.Provider>
  );
}

export function useMobileActions() {
  const context = useContext(MobileActionsContext);
  if (!context)
    throw new Error('useMobileActions must be used within MobileActionsProvider');
  return context;
}
