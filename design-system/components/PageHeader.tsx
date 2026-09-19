/**
 * PageHeader (app UI refresh, 2026-09-14): the one header every screen uses.
 * Eyebrow (the nav group the page lives in, mono caps) · title (the base h1,
 * Fraunces) · optional meta line (a date, a count — mono) · optional lede ·
 * an actions cluster that sits right and wraps under the title below 720px.
 * The header carries the page-enter animation (base.css kb-pop) so a route
 * change reads as the page arriving, not the app repainting.
 *
 * A slot renders only when its prop is not `undefined` — callers pass
 * `undefined` (never `null`) for "absent".
 */
import type { JSX, ReactNode } from 'react';
import './PageHeader.css';

export interface PageHeaderProps {
  /** Mono, uppercase, accent. Convention: the nav group the page lives in ("Daily", "Book", "Growth", "System"). */
  eyebrow?: string;
  title: ReactNode;
  /** One sentence under the title, --ink-2. */
  lede?: ReactNode;
  /** Right-aligned cluster: buttons/links. Wraps under the title below 720px. */
  actions?: ReactNode;
  /** Small mono line after the title (a date, a count). */
  meta?: ReactNode;
  className?: string;
}

export function PageHeader({ eyebrow, title, lede, actions, meta, className }: PageHeaderProps): JSX.Element {
  return (
    <header className={['kb-page__head', className ?? ''].filter(Boolean).join(' ')}>
      <div className="kb-page__text">
        {eyebrow !== undefined && <p className="kb-page__eyebrow">{eyebrow}</p>}
        <h1 className="kb-page__title">{title}</h1>
        {meta !== undefined && <p className="kb-page__meta">{meta}</p>}
        {lede !== undefined && <p className="kb-page__lede">{lede}</p>}
      </div>
      {actions !== undefined && <div className="kb-page__actions">{actions}</div>}
    </header>
  );
}
