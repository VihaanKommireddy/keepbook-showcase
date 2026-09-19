/**
 * Empty states (DESIGN-SYSTEM §3.11, copy rules BRAND §5).
 * One sentence of fact + one action. Empty is a normal state, not a failure
 * and not a joke. Filtered-empty MUST name the active filters and offer
 * "Clear filters". First-run empties may add ONE small orientation line.
 */
import type { JSX, ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import './EmptyState.css';

export interface EmptyStateProps {
  /** 40px line-drawing glyph of the object (a book, a column, a radar arc). */
  glyph?: IconName;
  /** The one fact sentence: "No leads in this pipeline yet." */
  message: string;
  /** One primary or secondary Button. */
  action?: ReactNode;
  /** One small orientation line for first-run screens. */
  hint?: string;
  /** Filtered-empty: active filter chips + Clear filters (FilterBar). */
  filters?: ReactNode;
  className?: string;
}

export function EmptyState({
  glyph,
  message,
  action,
  hint,
  filters,
  className,
}: EmptyStateProps): JSX.Element {
  return (
    <div className={['kb-empty', className ?? ''].filter(Boolean).join(' ')}>
      {glyph !== undefined && (
        <span className="kb-empty__glyph">
          <Icon name={glyph} size={40} />
        </span>
      )}
      <p className="kb-empty__message">{message}</p>
      {filters !== undefined && <div className="kb-empty__filters">{filters}</div>}
      {action !== undefined && <div className="kb-empty__action">{action}</div>}
      {hint !== undefined && <p className="kb-empty__hint">{hint}</p>}
    </div>
  );
}
