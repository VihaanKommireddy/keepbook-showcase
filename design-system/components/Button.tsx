/**
 * Buttons (DESIGN-SYSTEM §3.1).
 * Variants: primary · secondary · ghost · danger (danger is reserved for the
 * confirm step inside a dialog — never bare on a page).
 * Working state: label swaps to a gerund, aria-busy, stays disabled — no
 * spinner under 150ms (§0.3), so no spinner at all here.
 */
import type { ButtonHTMLAttributes, JSX, ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import './Button.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: IconName;
  /** While set, replaces the label (use a gerund: "Importing…" without the ellipsis — e.g. "Importing rows"), disables, aria-busy. */
  working?: string;
  /** Why a disabled button is disabled — rendered as title (§3.1: a disabled primary must say why). */
  disabledReason?: string;
  children?: ReactNode;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  working,
  disabledReason,
  disabled,
  className,
  children,
  type,
  title,
  ...rest
}: ButtonProps): JSX.Element {
  const isWorking = working !== undefined;
  const classes = ['kb-btn', `kb-btn--${variant}`, `kb-btn--${size}`, className]
    .filter(Boolean)
    .join(' ');
  return (
    <button
      {...rest}
      type={type ?? 'button'}
      className={classes}
      disabled={disabled === true || isWorking}
      aria-busy={isWorking || undefined}
      title={disabled === true && disabledReason !== undefined ? disabledReason : title}
    >
      {icon !== undefined && <Icon name={icon} />}
      {isWorking ? working : children}
    </button>
  );
}
