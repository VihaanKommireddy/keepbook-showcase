/**
 * Non-modal popover (DESIGN-SYSTEM §3.6): trigger + floating panel.
 * Focus moves in on open, returns to the trigger on close; Esc closes;
 * outside click closes; trigger carries aria-expanded/aria-haspopup.
 * Used by FilterBar menus, the DatePicker calendar, calendar day popovers,
 * and the Kanban "Move to…" menu.
 */
import {
  useEffect,
  useId,
  useRef,
  type JSX,
  type ReactNode,
} from 'react';
import './Popover.css';

export interface PopoverProps {
  open: boolean;
  onClose: () => void;
  /** Render the trigger; receives wiring props to spread onto a <button>. */
  trigger: (props: {
    ref: (el: HTMLButtonElement | null) => void;
    'aria-expanded': boolean;
    'aria-haspopup': 'dialog';
    'aria-controls': string;
  }) => ReactNode;
  children: ReactNode;
  /** Accessible name for the panel. */
  label: string;
  align?: 'start' | 'end';
  className?: string;
  /** Focus the panel itself instead of its first focusable (grids manage their own focus). */
  focusPanel?: boolean;
}

export function Popover({
  open,
  onClose,
  trigger,
  children,
  label,
  align = 'start',
  className,
  focusPanel,
}: PopoverProps): JSX.Element {
  const id = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      const panel = panelRef.current;
      if (panel !== null) {
        if (focusPanel === true) {
          panel.focus();
        } else {
          const first = panel.querySelector<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          );
          (first ?? panel).focus();
        }
      }
    } else if (wasOpen.current) {
      wasOpen.current = false;
      triggerRef.current?.focus();
    }
  }, [open, focusPanel]);

  useEffect(() => {
    if (!open) return;
    const onDocPointerDown = (e: PointerEvent): void => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) === true) return;
      if (triggerRef.current?.contains(target) === true) return;
      onClose();
    };
    document.addEventListener('pointerdown', onDocPointerDown);
    return () => document.removeEventListener('pointerdown', onDocPointerDown);
  }, [open, onClose]);

  return (
    <div className={['kb-popover-anchor', className ?? ''].filter(Boolean).join(' ')}>
      {trigger({
        ref: (el) => {
          triggerRef.current = el;
        },
        'aria-expanded': open,
        'aria-haspopup': 'dialog',
        'aria-controls': id,
      })}
      {open && (
        <div
          ref={panelRef}
          id={id}
          role="dialog"
          aria-label={label}
          tabIndex={-1}
          className={`kb-popover kb-popover--${align}`}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation();
              onClose();
            }
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
