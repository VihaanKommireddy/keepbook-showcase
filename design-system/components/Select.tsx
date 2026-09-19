/**
 * Selects (DESIGN-SYSTEM §3.3): native <select>, styled — appearance none,
 * custom chevron rendered as an inline SVG overlay (a data-URI background
 * would violate the strict prod CSP img-src 'self'), same metrics/border as
 * text inputs.
 * Native = free keyboard, mobile, screen-reader behavior; color-scheme keeps
 * the dropdown themed. (Custom listboxes are allowed only for multi-select
 * filters — see FilterBar — and searchable comboboxes, built by features.)
 */
import { useId, type JSX, type SelectHTMLAttributes } from 'react';
import { Icon } from './Icon';
import './Select.css';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectFieldProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'children'> {
  label: string;
  optional?: boolean;
  options: SelectOption[];
  /** Placeholder row rendered as a disabled empty-value option. */
  placeholder?: string;
  error?: string;
}

export function SelectField({
  label,
  optional,
  options,
  placeholder,
  error,
  className,
  ...rest
}: SelectFieldProps): JSX.Element {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className={['kb-field', error !== undefined ? 'kb-field--error' : '', className ?? '']
      .filter(Boolean)
      .join(' ')}
    >
      <label className="kb-field__label" htmlFor={id}>
        {label}
        {optional === true && <span className="kb-field__optional"> (optional)</span>}
      </label>
      <span className="kb-select__wrap">
        <select
          {...rest}
          id={id}
          className="kb-select"
          aria-invalid={error !== undefined || undefined}
          aria-describedby={error !== undefined ? errorId : undefined}
        >
          {placeholder !== undefined && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="kb-select__chevron" aria-hidden="true">
          <Icon name="chevron-down" />
        </span>
      </span>
      {error !== undefined && (
        <p className="kb-field__error" id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
}
