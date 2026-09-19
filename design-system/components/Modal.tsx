/**
 * Modals & dialogs (DESIGN-SYSTEM §3.7) on native <dialog> + showModal():
 * free focus trap, Esc, top layer, aria-modal. Widths 480 (forms) / 720
 * (Review changes, template preview). Scrim click closes only when the dialog
 * holds no user input (`dirty` blocks it); Esc always works, with a
 * confirm-discard when dirty. Footer: right-aligned Cancel + ONE primary.
 */
import { useEffect, useId, useRef, type JSX, type ReactNode } from 'react';
import './Modal.css';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** 480px forms (default) · 720px wide content. */
  width?: 'form' | 'wide';
  footer?: ReactNode;
  /** Set while the dialog holds unsaved user input: blocks scrim-close, Esc confirms discard. */
  dirty?: boolean;
  children: ReactNode;
  className?: string;
}

const DISCARD_PROMPT = 'Discard what you typed here? Nothing has been saved.';

export function Modal({
  open,
  onClose,
  title,
  width = 'form',
  footer,
  dirty,
  children,
  className,
}: ModalProps): JSX.Element {
  const ref = useRef<HTMLDialogElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (dialog === null) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={['kb-modal', `kb-modal--${width}`, className ?? ''].filter(Boolean).join(' ')}
      aria-labelledby={titleId}
      onCancel={(e) => {
        // Esc: confirm-discard if dirty, else close.
        if (dirty === true && !window.confirm(DISCARD_PROMPT)) {
          e.preventDefault();
          return;
        }
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // Scrim click = click landing on the dialog element itself.
        if (e.target === ref.current && dirty !== true) onClose();
      }}
    >
      <div className="kb-modal__inner">
        <h2 className="kb-modal__title" id={titleId}>
          {title}
        </h2>
        <div className="kb-modal__body">{children}</div>
        {footer !== undefined && <div className="kb-modal__footer">{footer}</div>}
      </div>
    </dialog>
  );
}
