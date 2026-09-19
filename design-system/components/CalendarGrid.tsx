/**
 * Calendar grid — month view (DESIGN-SYSTEM §3.13, the Renewals screen's
 * bones). 7-col <table>, Mon–Sun header, day cells ≥96px, up to 3 entries per
 * day then "+N more" opening the day's list popover. An entry with an active
 * filing gets the amber left-edge bar + "filing" badge — that intersection is
 * the money pixel of the whole app. Header: month title, ‹ › steppers, Today,
 * totals strip. Keyboard follows the date-picker map; Enter on a day opens
 * the day popover.
 */
import { useId, useState, type JSX, type KeyboardEvent, type ReactNode } from 'react';
import {
  addDays,
  addMonthsClamped,
  monthKey,
  type ISODate,
} from '@keepbook/shared';
import { Badge } from './Badge';
import { Icon } from './Icon';
import { buildMonthGrid } from './DatePicker';
import './CalendarGrid.css';

export interface CalendarEntry {
  id: number | string;
  label: string;
  /** Line chip / premium — preformatted short text. */
  detail?: string;
  /** Amber left edge + "filing" badge (approved Radar filing intersects). */
  filing?: boolean;
  onOpen?: () => void;
}

export interface CalendarGridProps {
  /** Any date inside the displayed month. */
  month: ISODate;
  today: ISODate;
  entries: Readonly<Record<string, CalendarEntry[]>>;
  onMonthChange: (month: ISODate) => void;
  /** "14 renewals · $28,410" totals strip, preformatted. */
  totals?: string;
  /** Filter chips row (FilterBar) rendered in the header. */
  filters?: ReactNode;
  className?: string;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function CalendarGrid({
  month,
  today,
  entries,
  onMonthChange,
  totals,
  filters,
  className,
}: CalendarGridProps): JSX.Element {
  const titleId = useId();
  const [focused, setFocused] = useState<ISODate>(month);
  const [openDay, setOpenDay] = useState<ISODate | null>(null);
  const grid = buildMonthGrid(month);
  const thisMonth = monthKey(month);
  const title = `${MONTHS[Number(month.slice(5, 7)) - 1] ?? ''} ${month.slice(0, 4)}`;

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
      const next = move();
      setFocused(next);
      if (monthKey(next) !== thisMonth) onMonthChange(next);
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      setOpenDay(focused);
    } else if (e.key === 'Escape' && openDay !== null) {
      e.preventDefault();
      setOpenDay(null);
    }
  };

  return (
    <div className={['kb-calgrid', className ?? ''].filter(Boolean).join(' ')}>
      <header className="kb-calgrid__header">
        <h2 className="kb-calgrid__title" id={titleId}>
          {title}
        </h2>
        <button
          type="button"
          className="kb-calgrid__step"
          aria-label="Previous month"
          onClick={() => onMonthChange(addMonthsClamped(month, -1))}
        >
          <Icon name="chevron-left" />
        </button>
        <button
          type="button"
          className="kb-calgrid__step"
          aria-label="Next month"
          onClick={() => onMonthChange(addMonthsClamped(month, 1))}
        >
          <Icon name="chevron-right" />
        </button>
        <button type="button" className="kb-calgrid__todaybtn" onClick={() => onMonthChange(today)}>
          Today
        </button>
        {filters}
        {totals !== undefined && <span className="kb-calgrid__totals kb-tabular">{totals}</span>}
      </header>
      <table
        className="kb-calgrid__table"
        aria-labelledby={titleId}
        tabIndex={0}
        onKeyDown={onGridKeyDown}
      >
        <thead>
          <tr>
            {WEEKDAYS.map((w) => (
              <th key={w} scope="col">
                {w}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: grid.length / 7 }, (_, w) => (
            <tr key={w}>
              {grid.slice(w * 7, w * 7 + 7).map((d) => {
                const dayEntries = entries[d] ?? [];
                const shown = dayEntries.slice(0, 3);
                const extra = dayEntries.length - shown.length;
                return (
                  <td
                    key={d}
                    className={[
                      'kb-calgrid__day',
                      monthKey(d) !== thisMonth ? 'kb-calgrid__day--out' : '',
                      d === today ? 'kb-calgrid__day--today' : '',
                      d === focused ? 'kb-calgrid__day--focused' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => setFocused(d)}
                  >
                    <span className="kb-calgrid__daynum kb-tabular">{Number(d.slice(8, 10))}</span>
                    <div className="kb-calgrid__entries">
                      {shown.map((entry) => (
                        <button
                          key={entry.id}
                          type="button"
                          className={`kb-calgrid__entry${entry.filing === true ? ' kb-calgrid__entry--filing' : ''}`}
                          onClick={entry.onOpen}
                        >
                          <span className="kb-calgrid__entrylabel">{entry.label}</span>
                          {entry.detail !== undefined && (
                            <span className="kb-calgrid__entrydetail kb-tabular">{entry.detail}</span>
                          )}
                          {entry.filing === true && <Badge variant="amber">filing</Badge>}
                        </button>
                      ))}
                      {extra > 0 && (
                        <button
                          type="button"
                          className="kb-calgrid__more"
                          onClick={() => setOpenDay(d)}
                        >
                          +{extra} more
                        </button>
                      )}
                    </div>
                    {openDay === d && (
                      <div className="kb-calgrid__daypopover" role="dialog" aria-label={`Renewals on ${d}`}>
                        <div className="kb-calgrid__daypopover-head">
                          <span>{d}</span>
                          <button
                            type="button"
                            className="kb-calgrid__daypopover-close"
                            aria-label="Close"
                            onClick={() => setOpenDay(null)}
                          >
                            <Icon name="x" />
                          </button>
                        </div>
                        {dayEntries.length === 0 ? (
                          <p className="kb-calgrid__dayempty">Nothing on this day.</p>
                        ) : (
                          dayEntries.map((entry) => (
                            <button
                              key={entry.id}
                              type="button"
                              className="kb-calgrid__entry"
                              onClick={entry.onOpen}
                            >
                              <span className="kb-calgrid__entrylabel">{entry.label}</span>
                              {entry.detail !== undefined && (
                                <span className="kb-calgrid__entrydetail kb-tabular">
                                  {entry.detail}
                                </span>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
