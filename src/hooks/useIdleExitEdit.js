
import { useEffect } from 'react';

/**
 * While `editing` is true, calls `exit()` after `timeoutMs` of no user interaction
 * (typing, clicking, scrolling, touch). Any such activity resets the timer.
 *
 * `exit` should be stable (wrap in useCallback) to avoid needless timer resets.
 */
export function useIdleExitEdit(editing, exit, timeoutMs = 60000) {
  useEffect(() => {
    if (!editing || typeof exit !== 'function') return undefined;

    let timer;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => exit(), timeoutMs);
    };

    const events = ['keydown', 'mousedown', 'touchstart', 'input', 'wheel'];
    reset();
    events.forEach((e) => window.addEventListener(e, reset, true));

    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset, true));
    };
  }, [editing, exit, timeoutMs]);
}