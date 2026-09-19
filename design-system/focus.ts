/**
 * Focus-restoration helper (WCAG 2.4.3). Overlays that steal focus must return
 * it to the opener on close. The DS Modal/Popover already do this; the Drawer's
 * programmatic close path (and jsdom's partial <dialog> polyfill) do not restore
 * focus on their own, so those components capture the trigger explicitly and
 * restore it. Shared so A11Y focus-return behaviour stays identical everywhere.
 */
import { useRef } from 'react';

export interface FocusReturn {
  /** Remember the element focused right now (call just before moving focus in). */
  capture: () => void;
  /** Return focus to the captured element if it is still in the document. */
  restore: () => void;
}

export function useFocusReturn(): FocusReturn {
  const stored = useRef<HTMLElement | null>(null);
  const api = useRef<FocusReturn>({
    capture: () => {
      const active = document.activeElement;
      stored.current = active instanceof HTMLElement ? active : null;
    },
    restore: () => {
      const el = stored.current;
      stored.current = null;
      if (el !== null && el.isConnected) el.focus();
    },
  });
  return api.current;
}
