/**
 * Text inputs & textareas (DESIGN-SYSTEM §3.2).
 * Label above (real <label for>), optional help line, error line linked via
 * aria-describedby, aria-invalid on error. Numeric fields: inputmode decimal,
 * right-aligned, tabular-nums. Required is the default — mark the exceptions
 * "(optional)" instead of a bare asterisk.
 */
import {
  useId,
  type InputHTMLAttributes,
  type JSX,
  type TextareaHTMLAttributes,
} from 'react';
import { Icon } from './Icon';
import './Input.css';

interface FieldChromeProps {
  label: string;
  optional?: boolean;
  help?: string;
  error?: string;
}

function fieldClasses(error: string | undefined, extra?: string): string {
  return ['kb-field', error !== undefined ? 'kb-field--error' : '', extra ?? '']
    .filter(Boolean)
    .join(' ');
}

export interface TextFieldProps
  extends FieldChromeProps,
    Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  /** premium / % style fields: inputmode decimal, right-aligned tabular figures */
  numeric?: boolean;
}

export function TextField({
  label,
  optional,
  help,
  error,
  numeric,
  className,
  ...rest
}: TextFieldProps): JSX.Element {
  const id = useId();
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const describedBy =
    [help !== undefined ? helpId : null, error !== undefined ? errorId : null]
      .filter((v): v is string => v !== null)
      .join(' ') || undefined;
  return (
    <div className={fieldClasses(error, className)}>
      <label className="kb-field__label" htmlFor={id}>
        {label}
        {optional === true && <span className="kb-field__optional"> (optional)</span>}
      </label>
      <input
        {...rest}
        id={id}
        className={`kb-field__input${numeric === true ? ' kb-field__input--numeric' : ''}`}
        inputMode={numeric === true ? 'decimal' : rest.inputMode}
        aria-invalid={error !== undefined || undefined}
        aria-describedby={describedBy}
      />
      {help !== undefined && (
        <p className="kb-field__help" id={helpId}>
          {help}
        </p>
      )}
      {error !== undefined && (
        // A11Y-5: role="alert" (aria-live=assertive) so AT announces the
        // validation failure when the error appears, not only when the field
        // is re-visited via aria-describedby.
        <p className="kb-field__error" id={errorId} role="alert">
          <Icon name="warning" /> {error}
        </p>
      )}
    </div>
  );
}

export interface TextAreaFieldProps
  extends FieldChromeProps,
    Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {}

export function TextAreaField({
  label,
  optional,
  help,
  error,
  className,
  rows,
  ...rest
}: TextAreaFieldProps): JSX.Element {
  const id = useId();
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const describedBy =
    [help !== undefined ? helpId : null, error !== undefined ? errorId : null]
      .filter((v): v is string => v !== null)
      .join(' ') || undefined;
  return (
    <div className={fieldClasses(error, className)}>
      <label className="kb-field__label" htmlFor={id}>
        {label}
        {optional === true && <span className="kb-field__optional"> (optional)</span>}
      </label>
      <textarea
        {...rest}
        id={id}
        rows={rows ?? 4}
        className="kb-field__input kb-field__input--area"
        aria-invalid={error !== undefined || undefined}
        aria-describedby={describedBy}
      />
      {help !== undefined && (
        <p className="kb-field__help" id={helpId}>
          {help}
        </p>
      )}
      {error !== undefined && (
        // A11Y-5: role="alert" (aria-live=assertive) so AT announces the
        // validation failure when the error appears, not only when the field
        // is re-visited via aria-describedby.
        <p className="kb-field__error" id={errorId} role="alert">
          <Icon name="warning" /> {error}
        </p>
      )}
    </div>
  );
}
