/**
 * Kanban primitives (DESIGN-SYSTEM §3.5).
 * Columns: --sunken track, 280px, header = name + count pill + premium sum.
 * Cards: surface, radius-md, shadow-1; left 3px edge color only as STATE
 * (stale = warn, overdue = danger) — never per-carrier decoration.
 * Keyboard is required, not a fallback:
 *   Enter opens · M opens "Move to…" menu · Space lifts/drops with arrows
 *   moving the ghost · Esc cancels. Every move — mouse or keys — announces
 *   through a visually-hidden aria-live region.
 * Columns >25 cards collapse the tail behind "Show N more".
 */
import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type JSX,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { enterStyle, useEntrance } from '../motion';
import { Popover } from './Popover';
import { shouldOpenFromClick } from './Table';
import './Kanban.css';

export interface KanbanCardData {
  id: number | string;
  title: string;
  /** line + carrier meta line. */
  meta?: string;
  /** premium, preformatted, right-aligned tabular. */
  amount?: string;
  /** footer chip: due/parked date, stale badge — caller-rendered. */
  footer?: ReactNode;
  edge?: 'stale' | 'overdue' | null;
}

export interface KanbanColumnData {
  id: number | string;
  name: string;
  /** premium sum, preformatted. */
  sum?: string;
  cards: KanbanCardData[];
}

export interface KanbanMove {
  cardId: number | string;
  fromColumnId: number | string;
  toColumnId: number | string;
  /** Target index within the destination column. */
  index: number;
}

export interface KanbanBoardProps {
  columns: KanbanColumnData[];
  onMove: (move: KanbanMove) => void;
  onOpenCard?: (cardId: number | string) => void;
  collapseAfter?: number;
  className?: string;
}

interface Lifted {
  cardId: number | string;
  fromColumnId: number | string;
  columnIndex: number;
  index: number;
}

const DRAG_MIME = 'application/x-keepbook-card';

export function KanbanBoard({
  columns,
  onMove,
  onOpenCard,
  collapseAfter = 25,
  className,
}: KanbanBoardProps): JSX.Element {
  // First paint only: a drop or a refetch reorders the DOM, and a replayed
  // entrance would blink the moved card out for the length of its delay.
  const entering = useEntrance();
  const [expanded, setExpanded] = useState<Set<number | string>>(new Set());
  const [lifted, setLifted] = useState<Lifted | null>(null);
  const [moveMenuFor, setMoveMenuFor] = useState<number | string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [dragOverColumn, setDragOverColumn] = useState<number | string | null>(null);
  const cardRefs = useRef(new Map<number | string, HTMLDivElement>());
  // A11Y-3: after a keyboard move/drop or a dismissed move-menu the card's DOM
  // node has re-rendered (often into another column) — return focus to it once
  // the new node is mounted, instead of letting focus fall to <body>.
  const pendingFocus = useRef<number | string | null>(null);

  useEffect(() => {
    if (pendingFocus.current === null) return;
    const el = cardRefs.current.get(pendingFocus.current);
    pendingFocus.current = null;
    el?.focus();
  });

  const findCard = (cardId: number | string): { columnIndex: number; index: number } | null => {
    for (let c = 0; c < columns.length; c += 1) {
      const i = columns[c]?.cards.findIndex((card) => card.id === cardId) ?? -1;
      if (i >= 0) return { columnIndex: c, index: i };
    }
    return null;
  };

  const announceMove = (card: KanbanCardData, col: KanbanColumnData, index: number): void => {
    setAnnouncement(`${card.title} moved to ${col.name}, position ${index + 1} of ${col.cards.length + (col.cards.some((x) => x.id === card.id) ? 0 : 1)}.`);
  };

  const commitMove = (cardId: number | string, toColumnIndex: number, index: number): void => {
    const pos = findCard(cardId);
    const toCol = columns[toColumnIndex];
    const fromCol = pos !== null ? columns[pos.columnIndex] : undefined;
    const card = fromCol?.cards[pos?.index ?? -1];
    if (pos === null || toCol === undefined || fromCol === undefined || card === undefined) return;
    onMove({ cardId, fromColumnId: fromCol.id, toColumnId: toCol.id, index });
    announceMove(card, toCol, index);
  };

  const onCardKeyDown = (
    e: KeyboardEvent<HTMLDivElement>,
    card: KanbanCardData,
    columnIndex: number,
    index: number,
  ): void => {
    if (e.key === 'Enter' && lifted === null) {
      e.preventDefault();
      onOpenCard?.(card.id);
      return;
    }
    if ((e.key === 'm' || e.key === 'M') && lifted === null) {
      e.preventDefault();
      setMoveMenuFor(card.id);
      return;
    }
    if (e.key === ' ') {
      e.preventDefault();
      if (lifted === null) {
        setLifted({ cardId: card.id, fromColumnId: columns[columnIndex]?.id ?? '', columnIndex, index });
        setAnnouncement(`${card.title} lifted. Use arrow keys to choose a position, Space to drop, Escape to cancel.`);
      } else if (lifted.cardId === card.id) {
        commitMove(card.id, lifted.columnIndex, lifted.index);
        pendingFocus.current = card.id;
        setLifted(null);
      }
      return;
    }
    if (lifted !== null && lifted.cardId === card.id) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setLifted(null);
        setAnnouncement('Move cancelled.');
        return;
      }
      const col = columns[lifted.columnIndex];
      if (col === undefined) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setLifted({ ...lifted, index: Math.min(col.cards.length, lifted.index + 1) });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setLifted({ ...lifted, index: Math.max(0, lifted.index - 1) });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const nextCol = Math.min(columns.length - 1, lifted.columnIndex + 1);
        setLifted({
          ...lifted,
          columnIndex: nextCol,
          index: Math.min(lifted.index, columns[nextCol]?.cards.length ?? 0),
        });
        setAnnouncement(`Over ${columns[nextCol]?.name ?? ''}.`);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const nextCol = Math.max(0, lifted.columnIndex - 1);
        setLifted({
          ...lifted,
          columnIndex: nextCol,
          index: Math.min(lifted.index, columns[nextCol]?.cards.length ?? 0),
        });
        setAnnouncement(`Over ${columns[nextCol]?.name ?? ''}.`);
      }
    }
  };

  const onDrop = (e: DragEvent, columnIndex: number, index: number): void => {
    e.preventDefault();
    setDragOverColumn(null);
    const raw = e.dataTransfer.getData(DRAG_MIME);
    if (raw === '') return;
    const cardId: number | string = raw.startsWith('n:') ? Number(raw.slice(2)) : raw.slice(2);
    commitMove(cardId, columnIndex, index);
  };

  return (
    <div className={['kb-kanban', className ?? ''].filter(Boolean).join(' ')}>
      <p className="kb-visually-hidden" aria-live="polite">
        {announcement}
      </p>
      {columns.map((col, columnIndex) => {
        const isExpanded = expanded.has(col.id);
        const visible = isExpanded ? col.cards : col.cards.slice(0, collapseAfter);
        const hidden = col.cards.length - visible.length;
        return (
          <section
            key={col.id}
            className={`kb-kanban__col${dragOverColumn === col.id ? ' kb-kanban__col--target' : ''}`}
            aria-label={col.name}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverColumn(col.id);
            }}
            onDragLeave={(e) => {
              if (e.currentTarget === e.target) setDragOverColumn(null);
            }}
            onDrop={(e) => onDrop(e, columnIndex, col.cards.length)}
          >
            <header className="kb-kanban__colhead">
              <span className="kb-kanban__colname">{col.name}</span>
              <span className="kb-kanban__count">{col.cards.length}</span>
              {col.sum !== undefined && (
                <span className="kb-kanban__sum kb-tabular">{col.sum}</span>
              )}
            </header>
            <div role="list" className="kb-kanban__cards">
              {visible.map((card, index) => {
                const isLifted = lifted?.cardId === card.id;
                const showInsertion =
                  lifted !== null &&
                  lifted.columnIndex === columnIndex &&
                  lifted.index === index;
                return (
                  <div key={card.id}>
                    {showInsertion && <div className="kb-kanban__insertion" aria-hidden="true" />}
                    <div
                      role="listitem"
                      ref={(el) => {
                        if (el !== null) cardRefs.current.set(card.id, el);
                        else cardRefs.current.delete(card.id);
                      }}
                      tabIndex={0}
                      draggable
                      className={`kb-kanban__card${entering ? ' kb-enter' : ''} kb-lift${
                        isLifted ? ' kb-kanban__card--lifted' : ''
                      }${card.edge != null ? ` kb-kanban__card--edge-${card.edge}` : ''}${
                        onOpenCard !== undefined ? ' kb-kanban__card--openable' : ''
                      }`}
                      style={entering ? enterStyle(index) : undefined}
                      onKeyDown={(e) => onCardKeyDown(e, card, columnIndex, index)}
                      onDragStart={(e) => {
                        e.dataTransfer.setData(
                          DRAG_MIME,
                          typeof card.id === 'number' ? `n:${card.id}` : `s:${card.id}`,
                        );
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDrop={(e) => {
                        e.stopPropagation();
                        onDrop(e, columnIndex, index);
                      }}
                      // Single click opens (spec §5); a native drag start never
                      // fires click, so a drag needs no extra state.
                      onClick={
                        onOpenCard !== undefined
                          ? (e) => {
                              if (shouldOpenFromClick(e)) onOpenCard(card.id);
                            }
                          : undefined
                      }
                      // Kept for one release so nothing that depended on it breaks.
                      onDoubleClick={() => onOpenCard?.(card.id)}
                    >
                      <div className="kb-kanban__cardrow">
                        <span className="kb-kanban__cardtitle">{card.title}</span>
                        {moveMenuFor === card.id ? (
                          <MoveMenu
                            columns={columns}
                            onPick={(toIndex) => {
                              commitMove(card.id, toIndex, columns[toIndex]?.cards.length ?? 0);
                              pendingFocus.current = card.id;
                              setMoveMenuFor(null);
                            }}
                            onClose={() => {
                              pendingFocus.current = card.id;
                              setMoveMenuFor(null);
                            }}
                          />
                        ) : null}
                      </div>
                      {card.meta !== undefined && (
                        <div className="kb-kanban__cardmeta">{card.meta}</div>
                      )}
                      {card.amount !== undefined && (
                        <div className="kb-kanban__cardamount kb-tabular">{card.amount}</div>
                      )}
                      {card.footer !== undefined && (
                        <div className="kb-kanban__cardfooter">{card.footer}</div>
                      )}
                    </div>
                  </div>
                );
              })}
              {lifted !== null &&
                lifted.columnIndex === columnIndex &&
                lifted.index >= visible.length && (
                  <div className="kb-kanban__insertion" aria-hidden="true" />
                )}
            </div>
            {hidden > 0 && (
              <button
                type="button"
                className="kb-kanban__showmore"
                onClick={() => setExpanded((prev) => new Set(prev).add(col.id))}
              >
                Show {hidden} more
              </button>
            )}
          </section>
        );
      })}
    </div>
  );
}

function MoveMenu({
  columns,
  onPick,
  onClose,
}: {
  columns: KanbanColumnData[];
  onPick: (columnIndex: number) => void;
  onClose: () => void;
}): JSX.Element {
  return (
    <Popover
      open
      onClose={onClose}
      label="Move to"
      align="end"
      trigger={(props) => (
        <button type="button" className="kb-visually-hidden" {...props}>
          Move to
        </button>
      )}
    >
      <div role="menu" aria-label="Move to" className="kb-kanban__movemenu">
        {columns.map((col, i) => (
          <button
            key={col.id}
            type="button"
            role="menuitem"
            className="kb-kanban__moveitem"
            onClick={() => onPick(i)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                (e.currentTarget.nextElementSibling as HTMLElement | null)?.focus();
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                (e.currentTarget.previousElementSibling as HTMLElement | null)?.focus();
              }
            }}
          >
            {col.name} ({col.cards.length})
          </button>
        ))}
      </div>
    </Popover>
  );
}
