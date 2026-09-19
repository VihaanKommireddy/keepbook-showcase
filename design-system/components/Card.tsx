/**
 * Plain surface card — bg surface, hairline border, radius-lg, shadow-1.
 * `interactive` (or any onClick) marks it as a target: the kb-lift hover from
 * base.css plus a pointer cursor. A card with an onClick is also a keyboard
 * target: role="button", in the tab order, and Enter/Space activate it (a
 * <button> can't hold a card's block content, so the semantics are added
 * here). Callers may still pass their own role/tabIndex to override.
 */
import type { HTMLAttributes, JSX, KeyboardEvent, ReactNode } from 'react';
import './Card.css';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** The card is a target (an href/onClick sits behind it): hover lift + pointer. */
  interactive?: boolean;
}

export function Card({ children, className, interactive, onClick, ...rest }: CardProps): JSX.Element {
  const lifts = interactive === true || onClick !== undefined;
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    rest.onKeyDown?.(e);
    if (e.defaultPrevented || e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.currentTarget.click();
    }
  };
  const keyboard =
    onClick !== undefined ? { role: 'button', tabIndex: 0, onKeyDown } : {};
  return (
    <div
      {...keyboard}
      {...rest}
      onClick={onClick}
      className={['kb-card', lifts ? 'kb-card--interactive kb-lift' : '', className ?? '']
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
