/**
 * Framework-free toast bus (DESIGN-SYSTEM §3.8).
 * Anything (the api client included) calls toast(); the shell's <ToastRegion>
 * subscribes and renders. Errors must NEVER be toast-only — they render inline
 * at the point of failure; toasts are for confirmations and undo affordances.
 */

export interface ToastAction {
  label: string;
  onPress: () => void;
}

export interface ToastInput {
  message: string;
  action?: ToastAction;
  /**
   * Undoable toasts persist 30s (soft-deletes: stage delete, batch ops);
   * everything else auto-dismisses at 6s.
   */
  undoable?: boolean;
}

export interface ToastItem extends ToastInput {
  id: number;
}

type Listener = (t: ToastItem) => void;

const listeners = new Set<Listener>();
let nextId = 1;

export function toast(input: ToastInput): void {
  const item: ToastItem = { ...input, id: nextId };
  nextId += 1;
  for (const l of listeners) l(item);
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
