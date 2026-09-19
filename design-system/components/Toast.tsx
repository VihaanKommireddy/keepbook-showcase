/**
 * Toast region (DESIGN-SYSTEM §3.8): bottom-right stack, max 3, inverse card.
 * Success/info auto-dismiss 6s (pause on hover/focus); undoable toasts persist
 * 30s. Container role="status" aria-live="polite"; the action is a real
 * button; Esc dismisses the focused toast.
 */
import { useEffect, useRef, useState, type JSX } from 'react';
import { subscribeToasts, type ToastItem } from '../toast-bus';
import './Toast.css';

const AUTO_DISMISS_MS = 6_000;
const UNDOABLE_MS = 30_000;
const MAX_VISIBLE = 3;

interface Timed {
  item: ToastItem;
  expiresAt: number;
  remaining: number;
  pausedAt: number | null;
}

export function ToastRegion(): JSX.Element {
  const [toasts, setToasts] = useState<Timed[]>([]);
  const regionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return subscribeToasts((item) => {
      const ttl = item.undoable === true ? UNDOABLE_MS : AUTO_DISMISS_MS;
      setToasts((prev) => {
        const next = [
          ...prev,
          { item, expiresAt: Date.now() + ttl, remaining: ttl, pausedAt: null },
        ];
        return next.slice(-MAX_VISIBLE);
      });
    });
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setToasts((prev) => prev.filter((t) => t.pausedAt !== null || t.expiresAt > now));
    }, 250);
    return () => clearInterval(interval);
  }, [toasts.length]);

  const dismiss = (id: number): void => {
    setToasts((prev) => prev.filter((t) => t.item.id !== id));
  };

  const pause = (id: number): void => {
    setToasts((prev) =>
      prev.map((t) =>
        t.item.id === id && t.pausedAt === null
          ? { ...t, pausedAt: Date.now(), remaining: t.expiresAt - Date.now() }
          : t,
      ),
    );
  };

  const resume = (id: number): void => {
    setToasts((prev) =>
      prev.map((t) =>
        t.item.id === id && t.pausedAt !== null
          ? { ...t, pausedAt: null, expiresAt: Date.now() + t.remaining }
          : t,
      ),
    );
  };

  return (
    <div className="kb-toast-region" role="status" aria-live="polite" ref={regionRef}>
      {toasts.map(({ item }) => (
        <div
          key={item.id}
          className="kb-toast"
          tabIndex={-1}
          onMouseEnter={() => pause(item.id)}
          onMouseLeave={() => resume(item.id)}
          onFocus={() => pause(item.id)}
          onBlur={() => resume(item.id)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') dismiss(item.id);
          }}
        >
          <span className="kb-toast__message">{item.message}</span>
          {item.action !== undefined && (
            <button
              type="button"
              className="kb-toast__action"
              onClick={() => {
                item.action?.onPress();
                dismiss(item.id);
              }}
            >
              {item.action.label}
            </button>
          )}
          <button
            type="button"
            className="kb-toast__close"
            aria-label="Dismiss notification"
            onClick={() => dismiss(item.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
