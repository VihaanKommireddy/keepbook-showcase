/**
 * Stat cards (DESIGN-SYSTEM §3.12). 4-up row (2-up <900px). The context line
 * is MANDATORY and carries the honest math ("Should be at $8,200 by Aug 15").
 * Deltas are signed and colored PLUS a ▲▼ glyph — color never alone. A card
 * that links gets a real <a> and hover elevation; otherwise it's a <div> with
 * no fake affordance.
 */
import type { JSX, ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import './StatCard.css';

export interface StatDelta {
  /** Preformatted, signed: "+7.5%", "−$412". */
  value: string;
  direction: 'up' | 'down';
  /** Is this movement good news? Colors accent vs danger. */
  good: boolean;
}

export interface StatCardProps {
  label: string;
  /** Preformatted tabular value: "$11,940". */
  value: string;
  /** Mandatory honest-math context line. */
  context: string;
  delta?: StatDelta;
  href?: string;
  className?: string;
  /** Optional decorative glyph (DESIGN §22) — sits beside the label, never
   *  inside .kb-stat__value, so the value node's text content stays exactly
   *  `value` (+ delta) for every consumer that reads it. */
  icon?: IconName;
}

export function StatCard({ label, value, context, delta, href, className, icon }: StatCardProps): JSX.Element {
  const body = (
    <>
      <span className="kb-stat__head">
        <span className="kb-stat__label">{label}</span>
        {icon !== undefined && <Icon name={icon} className="kb-stat__icon" />}
      </span>
      <span className="kb-stat__value kb-tabular">
        {value}
        {delta !== undefined && (
          <span className={`kb-stat__delta kb-stat__delta--${delta.good ? 'good' : 'bad'}`}>
            <span aria-hidden="true">{delta.direction === 'up' ? '▲' : '▼'}</span> {delta.value}
          </span>
        )}
      </span>
      <span className="kb-stat__context">{context}</span>
    </>
  );
  if (href !== undefined) {
    return (
      <a href={href} className={['kb-stat', 'kb-stat--link', 'kb-lift', className ?? ''].filter(Boolean).join(' ')}>
        {body}
      </a>
    );
  }
  return <div className={['kb-stat', className ?? ''].filter(Boolean).join(' ')}>{body}</div>;
}

/** The 4-up row container (2-up <900px). */
export function StatCardRow({ children, className }: { children: ReactNode; className?: string }): JSX.Element {
  return <div className={['kb-stat-row', className ?? ''].filter(Boolean).join(' ')}>{children}</div>;
}
