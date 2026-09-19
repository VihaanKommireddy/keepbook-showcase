/**
 * Motion helpers for the base.css primitives (app UI refresh, 2026-09-14).
 * `.kb-enter` reads `--i` for its stagger delay: min(--i, 12) × 40ms.
 */
import { useEffect, useState, type CSSProperties } from 'react';

/** Rows past this index get no delay — they are below the fold. */
export const ENTER_STAGGER_CAP = 12;

/** How long the whole entrance lasts: 12 × 40 ms of stagger + the 380 ms pop. */
export const ENTER_TOTAL_MS = 900;

/** The `style` for a `kb-enter` element: its index feeds the stagger delay. */
export function enterStyle(index: number): CSSProperties {
  return { '--i': index } as CSSProperties;
}

/**
 * True for the first ~900 ms after mount, then false for the life of the
 * component. Entrances are a first-paint effect; later re-renders and DOM
 * reorders (a sort click, a filter refetch, a kanban drop) must not replay
 * them — `.kb-enter` runs `kb-pop` with `backwards` fill and a delay of up to
 * 480 ms, so a replayed entrance leaves the row at opacity 0 for that long.
 * Because the fill is `backwards`, dropping the class once the entrance has
 * finished changes nothing visually.
 */
export function useEntrance(): boolean {
  const [entering, setEntering] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setEntering(false), ENTER_TOTAL_MS);
    return () => window.clearTimeout(t);
  }, []);
  return entering;
}
