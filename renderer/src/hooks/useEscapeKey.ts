import { useEffect } from 'react';

/**
 * Invokes `onEscape` when the Escape key is pressed (capture phase).
 * Use for modal/dialog dismissal; keep `onEscape` stable via `useCallback` when possible.
 */
export const useEscapeKey = (onEscape: () => void, enabled = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      onEscape();
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onEscape, enabled]);
};
