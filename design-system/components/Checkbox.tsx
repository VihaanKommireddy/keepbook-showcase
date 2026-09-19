/**
 * Checkbox with a real <label> wrapper and a padded hit area (small visual
 * control, ≥32px effective target — DESIGN-SYSTEM §3 preamble).
 */
import type { InputHTMLAttributes, JSX, ReactNode } from 'react';
import './Checkbox.css';

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'children'> {
  children?: ReactNode;
}

export function Checkbox({ children, className, ...rest }: CheckboxProps): JSX.Element {
  return (
    <label className={['kb-checkbox', className ?? ''].filter(Boolean).join(' ')}>
      <input type="checkbox" {...rest} />
      {children !== undefined && <span className="kb-checkbox__label">{children}</span>}
    </label>
  );
}
