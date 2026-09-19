/**
 * Drawer / side panel (DESIGN-SYSTEM §3.16): edit/detail work where the
 * underlying table or board stays visible. Built on the same native <dialog>
 * + showModal() pattern as Modal (focus trap, Esc, top layer, aria-modal),
 * styled as a right-anchored full-height panel: 420px (forms) / 560px (wide),
 * 100vw on small screens. Never nest a drawer in a drawer; a modal may open
 * above one. Slide-in honors prefers-reduced-motion (fade only).
 */
import { useEffect, useId, useRef, type JSX, type ReactNode } from 'react';
import { Icon } from './Icon';
import { useFocusReturn } from '../focus';
import './Drawer.css';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** 420px forms (default) · 560px wide content. */
  width?: 'form' | 'wide';
  /** Form drawers get a modal-style footer: right-aligned Cancel + one primary. */
  footer?: ReactNode;
  dirty?: boolean;
  children: ReactNode;
  className?: string;
}

const DISCARD_PROMPT = 'Discard what you typed here? Nothing has been saved.';

/**
 * The guarded close every drawer chrome path uses (X, Escape). A footer
 * Cancel must route through this rather than calling `onClose` straight, or
 * the same click loses typed answers that Escape would have protected. Lives
 * here so the prompt text is written once.
 */
export function requestDrawerClose(dirty: boolean | undefined, onClose: () => void): void {
  if (dirty === true && !window.confirm(DISCARD_PROMPT)) return;
  onClose();
}

export function Drawer({
  open,
  onClose,
  title,
  width = 'form',
  footer,
  dirty,
  children,
  className,
}: DrawerProps): JSX.Element {
  const ref = useRef<HTMLDialogElement | null>(null);
  const titleId = useId();
  const focusReturn = useFocusReturn();

  useEffect(() => {
    const dialog = ref.current;
    if (dialog === null) return;
    if (open && !dialog.open) {
      // Capture the opener BEFORE showModal() moves focus into the dialog.
      focusReturn.capture();
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
      // Restore focus to the trigger on Esc/X/scrim close (WCAG 2.4.3) — the
      // programmatic close() path does not do this reliably on its own.
      focusReturn.restore();
    }
  }, [open, focusReturn]);

  return (
    <dialog
      ref={ref}
      className={['kb-drawer', `kb-drawer--${width}`, className ?? ''].filter(Boolean).join(' ')}
      aria-labelledby={titleId}
      onCancel={(e) => {
        // Always preventDefault: <dialog>'s own close is driven by the `open`
        // prop, so the guard decides whether onClose runs at all.
        e.preventDefault();
        requestDrawerClose(dirty, onClose);
      }}
      onClick={(e) => {
        if (e.target === ref.current && dirty !== true) onClose();
      }}
    >
      <div className="kb-drawer__inner">
        <header className="kb-drawer__header">
          <h2 className="kb-drawer__title" id={titleId}>
            {title}
          </h2>
          <button
            type="button"
            className="kb-drawer__close"
            aria-label="Close"
            onClick={() => requestDrawerClose(dirty, onClose)}
          >
            <Icon name="x" />
          </button>
        </header>
        <div className="kb-drawer__body">{children}</div>
        {footer !== undefined && <div className="kb-drawer__footer">{footer}</div>}
      </div>
    </dialog>
  );
}
