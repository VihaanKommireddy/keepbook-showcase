/**
 * Status badges & tag chips (DESIGN-SYSTEM §3.6).
 * Fixed meanings app-wide: green = active/won/add · blue = updated/info ·
 * amber = pending/conflict/stale · red = lapsed/lost/removed · neutral
 * otherwise. Color is never the only carrier — the badge always contains
 * the word.
 */
import type { JSX, ReactNode } from 'react';
import './Badge.css';

export type BadgeVariant = 'green' | 'blue' | 'amber' | 'red' | 'neutral';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

export function Badge({ variant = 'neutral', children, className }: BadgeProps): JSX.Element {
  return (
    <span className={['kb-badge', `kb-badge--${variant}`, className ?? ''].filter(Boolean).join(' ')}>
      {children}
    </span>
  );
}

export interface TagChipProps {
  name: string;
  /** Auto-tags are visibly distinct: small "auto" prefix (matrix §1a). */
  auto?: boolean;
  onRemove?: () => void;
  className?: string;
}

export function TagChip({ name, auto, onRemove, className }: TagChipProps): JSX.Element {
  return (
    <span className={['kb-tag', className ?? ''].filter(Boolean).join(' ')}>
      {auto === true && <span className="kb-tag__auto">auto</span>}
      {name}
      {onRemove !== undefined && (
        <button
          type="button"
          className="kb-tag__remove"
          aria-label={`Remove tag ${name}`}
          onClick={onRemove}
        >
          <svg
            viewBox="0 0 16 16"
            width={12}
            height={12}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="m3.5 3.5 9 9M12.5 3.5l-9 9" />
          </svg>
        </button>
      )}
    </span>
  );
}
