import { useEffect } from 'react';

export function useKeyboard(key, callback, modifiers = {}) {
  useEffect(() => {
    function handler(e) {
      const { ctrl = false, shift = false, alt = false } = modifiers;
      if (
        e.key.toLowerCase() === key.toLowerCase() &&
        e.ctrlKey === ctrl &&
        e.shiftKey === shift &&
        e.altKey === alt
      ) {
        e.preventDefault();
        callback(e);
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [key, callback, modifiers]);
}
