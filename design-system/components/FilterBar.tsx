/**
 * FilterBar (DESIGN-SYSTEM §3.4 toolbar + §3.6 popovers + BRAND §5).
 * Any filter that hides data is visible on the surface itself: active filters
 * render as removable chips, multi-select menus are checkbox-list popovers
 * (each option a real <label><input type="checkbox">), and "Clear filters"
 * appears whenever anything is active.
 * Round 2 §3: `FilterButton` + `FilterPanel` are the list-wide shape — one
 * button that counts what is applied, one panel it opens — lifted out of
 * BookPage, which had the only copy.
 */
import { useState, type JSX, type ReactNode, type RefObject } from 'react';
import { Button } from './Button';
import { Checkbox } from './Checkbox';
import { Icon } from './Icon';
import { Popover } from './Popover';
import './FilterBar.css';

export interface FilterChipData {
  id: string;
  /** "Carrier: Erie" — label names the field AND the value. */
  label: string;
  onRemove: () => void;
}

export interface FilterBarProps {
  chips: FilterChipData[];
  onClearAll?: () => void;
  /** FilterMenu triggers and any extra controls. */
  children?: ReactNode;
  className?: string;
}

export function FilterBar({ chips, onClearAll, children, className }: FilterBarProps): JSX.Element {
  return (
    <div className={['kb-filterbar', className ?? ''].filter(Boolean).join(' ')}>
      {children}
      {chips.map((chip) => (
        <span key={chip.id} className="kb-filterbar__chip">
          {chip.label}
          <button
            type="button"
            className="kb-filterbar__chipremove"
            aria-label={`Remove filter ${chip.label}`}
            onClick={chip.onRemove}
          >
            <Icon name="x" size={12} />
          </button>
        </span>
      ))}
      {chips.length > 0 && onClearAll !== undefined && (
        <button type="button" className="kb-filterbar__clear" onClick={onClearAll}>
          Clear filters
        </button>
      )}
    </div>
  );
}

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterMenuProps {
  label: string;
  options: FilterOption[];
  selected: ReadonlySet<string>;
  onChange: (next: Set<string>) => void;
}

export function FilterMenu({ label, options, selected, onChange }: FilterMenuProps): JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <Popover
      open={open}
      onClose={() => setOpen(false)}
      label={`Filter by ${label.toLowerCase()}`}
      trigger={(props) => (
        <button
          type="button"
          className={`kb-filterbar__menubtn${selected.size > 0 ? ' kb-filterbar__menubtn--active' : ''}`}
          onClick={() => setOpen((o) => !o)}
          {...props}
        >
          <Icon name="filter" />
          {label}
          {selected.size > 0 && <span className="kb-filterbar__menucount">{selected.size}</span>}
          <Icon name="chevron-down" />
        </button>
      )}
    >
      <div className="kb-filterbar__options">
        {options.map((opt) => (
          <Checkbox
            key={opt.value}
            checked={selected.has(opt.value)}
            onChange={(e) => {
              const next = new Set(selected);
              if (e.target.checked) next.add(opt.value);
              else next.delete(opt.value);
              onChange(next);
            }}
          >
            {opt.label}
          </Checkbox>
        ))}
      </div>
    </Popover>
  );
}

export interface FilterButtonProps {
  /** How many filters are applied right now; 0 renders a bare "Filters". */
  count: number;
  open: boolean;
  onToggle: () => void;
  /** The id of the FilterPanel this button opens (aria-controls). */
  panelId: string;
  className?: string;
}

/**
 * The one control a list's secondary filters live behind (round 2 §3). The
 * count is on the button itself so a collapsed panel never hides the fact
 * that data is filtered; the chips beside it still name each one.
 */
export function FilterButton({ count, open, onToggle, panelId, className }: FilterButtonProps): JSX.Element {
  return (
    <Button
      variant="secondary"
      icon="filter"
      aria-expanded={open}
      aria-controls={panelId}
      onClick={onToggle}
      {...(className !== undefined ? { className } : {})}
    >
      {count > 0 ? `Filters · ${count}` : 'Filters'}
    </Button>
  );
}

export interface FilterPanelProps {
  /** Must match the FilterButton's `panelId`. */
  id: string;
  open: boolean;
  children: ReactNode;
  /** For a page that moves focus into the panel (the `/` shortcut). */
  panelRef?: RefObject<HTMLDivElement | null>;
  className?: string;
}

/** The controls FilterButton opens. Absent from the DOM while closed, so a
 *  closed panel costs no tab stops. */
export function FilterPanel({ id, open, children, panelRef, className }: FilterPanelProps): JSX.Element | null {
  if (!open) return null;
  return (
    <div
      id={id}
      className={['kb-filterpanel', className ?? ''].filter(Boolean).join(' ')}
      {...(panelRef !== undefined ? { ref: panelRef } : {})}
    >
      {children}
    </div>
  );
}
