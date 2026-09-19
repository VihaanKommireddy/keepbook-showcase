/**
 * Date picking (DESIGN-SYSTEM §3.10).
 * Native <input type="date"> is the default everywhere (DateField). The custom
 * calendar popover exists ONLY where natives fail the workflow: relative jumps
 * ("Park until: +30/+60/+90 days") and range anchors. Grid: role="dialog"
 * popover, <table> grid, ↑↓←→ day · PgUp/PgDn month · Shift+PgUp/PgDn year ·
 * Enter select · Esc close, aria-activedescendant + visually-hidden announce.
 * Manual typing always allowed alongside — the input stays editable.
 *
 * All arithmetic via @keepbook/shared dates — no `new Date()` calendar math.
 */
import { useId, useState, type JSX, type KeyboardEvent } from 'react';
import {
  addDays,
  addMonthsClamped,
  dayOfWeek,
  daysInMonth,
  isValidISODate,
  monthKey,
  type ISODate,
} from '@keepbook/shared';
import { Icon } from './Icon';
import { Popover } from './Popover';
import './DatePicker.css';

/* ── Native default ──────────────────────────────────────────────────────── */

export interface DateFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  optional?: boolean;
  error?: string;
  min?: string;
  max?: string;
  className?: string;
}

export function DateField({
  label,
  value,
  onChange,
  optional,
  error,
  min,
  max,
  className,
}: DateFieldProps): JSX.Element {
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
      <input
        id={id}
        type="date"
        className="kb-field__input"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error !== undefined || undefined}
        aria-describedby={error !== undefined ? errorId : undefined}
      />
      {error !== undefined && (
        <p className="kb-field__error" id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
}

/* ── Custom calendar popover (relative jumps / ranges only) ──────────────── */

export interface DatePreset {
  label: string; // "+30 days"
  days: number;
}

export interface DatePickerProps {
  label: string;
  value: ISODate | '';
  onChange: (value: ISODate) => void;
  /** The reference date presets add to — callers pass the app's `today`. */
  today: ISODate;
  presets?: DatePreset[];
  optional?: boolean;
  error?: string;
  className?: string;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function monthTitle(d: ISODate): string {
  const m = Number(d.slice(5, 7));
  return `${MONTHS[m - 1] ?? ''} ${d.slice(0, 4)}`;
}

function humanDate(d: ISODate): string {
  const m = Number(d.slice(5, 7));
  return `${(MONTHS[m - 1] ?? '').slice(0, 3)} ${Number(d.slice(8, 10))}, ${d.slice(0, 4)}`;
}

/** Mon-first grid of ISO dates covering the month of `anchor`, padded with neighbors. */
export function buildMonthGrid(anchor: ISODate): ISODate[] {
  const first = `${anchor.slice(0, 7)}-01`;
  const lead = (dayOfWeek(first) + 6) % 7; // Mon=0
  const start = addDays(first, -lead);
  const total = lead + daysInMonth(Number(anchor.slice(0, 4)), Number(anchor.slice(5, 7)));
  const weeks = Math.ceil(total / 7);
  const out: ISODate[] = [];
  for (let i = 0; i < weeks * 7; i += 1) out.push(addDays(start, i));
  return out;
}

export function DatePicker({
  label,
  value,
  onChange,
  today,
  presets,
  optional,
  error,
  className,
}: DatePickerProps): JSX.Element {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(value);
  const [focused, setFocused] = useState<ISODate>(value !== '' ? value : today);
  const gridId = `${id}-grid`;
  const errorId = `${id}-error`;

  const pick = (d: ISODate): void => {
    onChange(d);
    setText(d);
    setOpen(false);
  };

  const onGridKeyDown = (e: KeyboardEvent<HTMLTableElement>): void => {
    const moves: Record<string, () => ISODate> = {
      ArrowRight: () => addDays(focused, 1),
      ArrowLeft: () => addDays(focused, -1),
      ArrowDown: () => addDays(focused, 7),
      ArrowUp: () => addDays(focused, -7),
      PageDown: () => addMonthsClamped(focused, e.shiftKey ? 12 : 1),
      PageUp: () => addMonthsClamped(focused, e.shiftKey ? -12 : -1),
    };
    const move = moves[e.key];
    if (move !== undefined) {
      e.preventDefault();
      setFocused(move());
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      pick(focused);
    }
  };

  const grid = buildMonthGrid(focused);
  const currentMonth = monthKey(focused);

  return (
    <div className={['kb-field', error !== undefined ? 'kb-field--error' : '', className ?? '']
      .filter(Boolean)
      .join(' ')}
    >
      <label className="kb-field__label" htmlFor={id}>
        {label}
        {optional === true && <span className="kb-field__optional"> (optional)</span>}
      </label>
      <div className="kb-datepicker__row">
        <input
          id={id}
          className="kb-field__input"
          placeholder="YYYY-MM-DD"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (isValidISODate(e.target.value)) {
              onChange(e.target.value);
              setFocused(e.target.value);
            }
          }}
          aria-invalid={error !== undefined || undefined}
          aria-describedby={error !== undefined ? errorId : undefined}
        />
        <Popover
          open={open}
          onClose={() => setOpen(false)}
          label={`Choose ${label.toLowerCase()}`}
          align="end"
          focusPanel
          trigger={(props) => (
            <button
              type="button"
              className="kb-datepicker__toggle"
              aria-label={`Open calendar for ${label}`}
              onClick={() => setOpen((o) => !o)}
              {...props}
            >
              <Icon name="calendar" />
            </button>
          )}
        >
          {presets !== undefined && presets.length > 0 && (
            <div className="kb-datepicker__presets">
              {presets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  className="kb-datepicker__preset"
                  onClick={() => pick(addDays(today, p.days))}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
          <div className="kb-datepicker__monthbar">
            <button
              type="button"
              className="kb-datepicker__step"
              aria-label="Previous month"
              onClick={() => setFocused(addMonthsClamped(focused, -1))}
            >
              <Icon name="chevron-left" />
            </button>
            <span className="kb-datepicker__monthtitle">{monthTitle(focused)}</span>
            <button
              type="button"
              className="kb-datepicker__step"
              aria-label="Next month"
              onClick={() => setFocused(addMonthsClamped(focused, 1))}
            >
              <Icon name="chevron-right" />
            </button>
          </div>
          <table
            className="kb-datepicker__grid"
            role="grid"
            aria-activedescendant={`${gridId}-${focused}`}
            tabIndex={0}
            onKeyDown={onGridKeyDown}
          >
            <thead>
              <tr>
                {WEEKDAYS.map((w) => (
                  <th key={w} scope="col" abbr={w}>
                    {w.slice(0, 2)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: grid.length / 7 }, (_, w) => (
                <tr key={w}>
                  {grid.slice(w * 7, w * 7 + 7).map((d) => (
                    <td key={d}>
                      <button
                        type="button"
                        id={`${gridId}-${d}`}
                        tabIndex={-1}
                        className={[
                          'kb-datepicker__day',
                          monthKey(d) !== currentMonth ? 'kb-datepicker__day--out' : '',
                          d === today ? 'kb-datepicker__day--today' : '',
                          d === value ? 'kb-datepicker__day--selected' : '',
                          d === focused ? 'kb-datepicker__day--focused' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        onClick={() => pick(d)}
                      >
                        {Number(d.slice(8, 10))}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="kb-visually-hidden" aria-live="polite">
            {humanDate(focused)}
          </p>
        </Popover>
      </div>
      {error !== undefined && (
        <p className="kb-field__error" id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
}
