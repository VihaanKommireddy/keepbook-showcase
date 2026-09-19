/**
 * Tables — the workhorse (DESIGN-SYSTEM §3.4).
 * Semantic <table>/<th scope> (never div-grids), sticky 28px header on
 * --sunken, cell padding setting row height (tighter under `compact`),
 * numeric columns right-aligned tabular,
 * roving-tabindex row focus:
 *   ↑↓ move · Space select · Enter open · Shift+↑↓ extend · Ctrl/Cmd+A page.
 * Toolbar shows the count; a batch bar (role="status") replaces it when rows
 * are selected. Wide content scrolls inside its own container with a sticky
 * first column — data columns are never dropped silently.
 */
import {
  useRef,
  useState,
  type JSX,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { ENTER_STAGGER_CAP, enterStyle, useEntrance } from '../motion';
import { Checkbox } from './Checkbox';
import './Table.css';

/**
 * What shouldOpenFromClick reads. Structural on purpose: both a DOM MouseEvent
 * and React's MouseEvent<T> satisfy it, so the guard serves onClick handlers
 * and unit tests alike without a cast.
 */
export interface OpenClickEvent {
  defaultPrevented: boolean;
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  target: EventTarget | null;
}

/**
 * Single-click open (app UI refresh §5, QA LOCAL-01). A click opens the row or
 * card unless it was already handled, was not the primary button, carried a
 * modifier (the user wants a new tab / a selection), landed on a control
 * inside the row, or the user was selecting text. Kanban reuses it: a native
 * drag start never fires click, so a drag needs no extra state.
 */
export function shouldOpenFromClick(e: OpenClickEvent): boolean {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  const t = e.target as HTMLElement;
  if (t.closest('a, button, input, select, textarea, label, [role="button"], [contenteditable="true"]') !== null) return false;
  const sel = typeof window !== 'undefined' ? window.getSelection() : null;
  return !(sel !== null && sel.type === 'Range' && sel.toString().length > 0);
}

export type SortDir = 'asc' | 'desc';

export interface ColumnDef<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  numeric?: boolean;
  sortable?: boolean;
  /** First column links to the record: weight 500, accent text. */
  link?: boolean;
  width?: string;
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  rows: T[];
  rowKey: (row: T) => number | string;
  /** "412 clients" — the toolbar count line (aria-live polite). */
  countLabel?: string;
  toolbar?: ReactNode;
  footer?: ReactNode;
  sort?: { key: string; dir: SortDir };
  onSortChange?: (key: string, dir: SortDir) => void;
  selectable?: boolean;
  selected?: ReadonlySet<number | string>;
  onSelectedChange?: (next: Set<number | string>) => void;
  /** Batch bar content shown while ≥1 row is selected (replaces the toolbar). */
  batchBar?: ReactNode;
  onOpenRow?: (row: T) => void;
  /** Rendered when rows is empty (EmptyState per §3.11). */
  empty?: ReactNode;
  compact?: boolean;
  stickyFirstColumn?: boolean;
  className?: string;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  countLabel,
  toolbar,
  footer,
  sort,
  onSortChange,
  selectable,
  selected,
  onSelectedChange,
  batchBar,
  onOpenRow,
  empty,
  compact,
  stickyFirstColumn,
  className,
}: DataTableProps<T>): JSX.Element {
  const [focusIndex, setFocusIndex] = useState(0);
  // First paint only: a sort click or a filter refetch must not re-stagger the
  // rows (they would sit at opacity 0 for the length of their delay).
  const entering = useEntrance();
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);
  const selectedSet = selected ?? new Set<number | string>();
  const anchorIndex = useRef<number | null>(null);

  const setSelected = (next: Set<number | string>): void => {
    onSelectedChange?.(next);
  };

  const toggleRow = (key: number | string): void => {
    const next = new Set(selectedSet);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelected(next);
  };

  const focusRow = (index: number): void => {
    const clamped = Math.max(0, Math.min(rows.length - 1, index));
    setFocusIndex(clamped);
    rowRefs.current[clamped]?.focus();
  };

  const onRowKeyDown = (e: KeyboardEvent<HTMLTableRowElement>, index: number, row: T): void => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = index + 1;
      if (e.shiftKey && selectable === true) extendTo(index, next);
      focusRow(next);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = index - 1;
      if (e.shiftKey && selectable === true) extendTo(index, next);
      focusRow(next);
    } else if (e.key === ' ' && selectable === true) {
      e.preventDefault();
      anchorIndex.current = index;
      toggleRow(rowKey(row));
    } else if (e.key === 'Enter' && onOpenRow !== undefined) {
      e.preventDefault();
      onOpenRow(row);
    } else if ((e.key === 'a' || e.key === 'A') && (e.ctrlKey || e.metaKey) && selectable === true) {
      e.preventDefault();
      setSelected(new Set(rows.map((r) => rowKey(r))));
    }
  };

  const extendTo = (from: number, to: number): void => {
    const clamped = Math.max(0, Math.min(rows.length - 1, to));
    const next = new Set(selectedSet);
    const fromRow = rows[from];
    const toRow = rows[clamped];
    if (fromRow !== undefined) next.add(rowKey(fromRow));
    if (toRow !== undefined) next.add(rowKey(toRow));
    setSelected(next);
  };

  const cycleSort = (key: string): void => {
    if (onSortChange === undefined) return;
    const dir: SortDir = sort?.key === key && sort.dir === 'asc' ? 'desc' : 'asc';
    onSortChange(key, dir);
  };

  const hasSelection = selectable === true && selectedSet.size > 0;

  return (
    <div className={['kb-table', className ?? ''].filter(Boolean).join(' ')}>
      {hasSelection && batchBar !== undefined ? (
        <div className="kb-table__batchbar" role="status">
          <span className="kb-table__batchcount">{selectedSet.size} selected</span>
          {batchBar}
        </div>
      ) : (
        (toolbar !== undefined || countLabel !== undefined) && (
          <div className="kb-table__toolbar">
            {toolbar}
            {countLabel !== undefined && (
              <span className="kb-table__count" aria-live="polite">
                {countLabel}
              </span>
            )}
          </div>
        )
      )}
      {rows.length === 0 && empty !== undefined ? (
        empty
      ) : (
        <div className="kb-table__scroll">
          <table
            className={[
              'kb-table__table',
              compact === true ? 'kb-table__table--compact' : '',
              stickyFirstColumn === true ? 'kb-table__table--sticky-first' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <thead>
              <tr>
                {selectable === true && (
                  <th scope="col" className="kb-table__checkcol">
                    <span className="kb-visually-hidden">Select</span>
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    style={col.width !== undefined ? { width: col.width } : undefined}
                    className={col.numeric === true ? 'kb-table__th--numeric' : undefined}
                    aria-sort={
                      sort?.key === col.key
                        ? sort.dir === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                  >
                    {col.sortable === true ? (
                      <button
                        type="button"
                        className="kb-table__sortbtn"
                        onClick={() => cycleSort(col.key)}
                      >
                        {col.header}
                        {sort?.key === col.key && (
                          <span aria-hidden="true">{sort.dir === 'asc' ? ' ▲' : ' ▼'}</span>
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const key = rowKey(row);
                const isSelected = selectedSet.has(key);
                return (
                  <tr
                    key={key}
                    ref={(el) => {
                      rowRefs.current[i] = el;
                    }}
                    tabIndex={i === focusIndex ? 0 : -1}
                    aria-selected={selectable === true ? isSelected : undefined}
                    className={[
                      entering ? 'kb-enter' : '',
                      isSelected ? 'kb-table__row--selected' : '',
                      onOpenRow !== undefined ? 'kb-table__row--openable' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    style={entering && i < ENTER_STAGGER_CAP ? enterStyle(i) : undefined}
                    onKeyDown={(e) => onRowKeyDown(e, i, row)}
                    onFocus={() => setFocusIndex(i)}
                    onClick={
                      onOpenRow !== undefined
                        ? (e) => {
                            if (shouldOpenFromClick(e)) onOpenRow(row);
                          }
                        : undefined
                    }
                    // Kept for one release so nothing that depended on it breaks.
                    onDoubleClick={onOpenRow !== undefined ? () => onOpenRow(row) : undefined}
                  >
                    {selectable === true && (
                      // Missing the box by a few px must not navigate away and
                      // lose the batch selection the user was building.
                      <td className="kb-table__checkcol" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onChange={() => toggleRow(key)}
                          aria-label={`Select row ${String(key)}`}
                        />
                      </td>
                    )}
                    {columns.map((col, ci) => (
                      <td
                        key={col.key}
                        className={[
                          col.numeric === true ? 'kb-table__td--numeric kb-tabular' : '',
                          ci === 0 && col.link === true ? 'kb-table__td--link' : '',
                        ]
                          .filter(Boolean)
                          .join(' ') || undefined}
                      >
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {footer !== undefined && <div className="kb-table__footer">{footer}</div>}
    </div>
  );
}
