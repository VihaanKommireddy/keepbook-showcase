/**
 * Kanban single-click open (app UI refresh §5): a click that did not become a
 * drag opens the card; native drag still moves it (dragstart never fires
 * click); every card carries the stagger + lift classes.
 */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ENTER_TOTAL_MS } from '../motion';
import { KanbanBoard, type KanbanColumnData } from './Kanban';

afterEach(cleanup);

const columns: KanbanColumnData[] = [
  { id: 'new', name: 'New', cards: [{ id: 1, title: 'Alpha' }, { id: 2, title: 'Bravo' }] },
  { id: 'contacted', name: 'Contacted', cards: [{ id: 3, title: 'Cara' }] },
];

/** The same board after a drag moved Bravo above Alpha. */
const reordered: KanbanColumnData[] = [
  { id: 'new', name: 'New', cards: [{ id: 2, title: 'Bravo' }, { id: 1, title: 'Alpha' }] },
  { id: 'contacted', name: 'Contacted', cards: [{ id: 3, title: 'Cara' }] },
];

const cardOf = (title: string): HTMLElement =>
  screen.getByText(title).closest('[role="listitem"]') as HTMLElement;

interface FakeDataTransfer {
  setData: (key: string, value: string) => void;
  getData: (key: string) => string;
  effectAllowed: string;
}

/** jsdom has no DataTransfer; testing-library attaches whatever object the
 *  event init carries, and the board only needs setData/getData. */
function fakeDataTransfer(): FakeDataTransfer {
  const data = new Map<string, string>();
  return {
    setData: (key, value) => {
      data.set(key, value);
    },
    getData: (key) => data.get(key) ?? '',
    effectAllowed: '',
  };
}

describe('KanbanBoard single-click open', () => {
  it('a plain click on a card opens it', () => {
    const onOpenCard = vi.fn();
    render(<KanbanBoard columns={columns} onMove={() => undefined} onOpenCard={onOpenCard} />);
    fireEvent.click(screen.getByText('Bravo'));
    expect(onOpenCard).toHaveBeenCalledTimes(1);
    expect(onOpenCard).toHaveBeenCalledWith(2);
  });

  it('a modifier-click does not open the card', () => {
    const onOpenCard = vi.fn();
    render(<KanbanBoard columns={columns} onMove={() => undefined} onOpenCard={onOpenCard} />);
    fireEvent.click(screen.getByText('Bravo'), { ctrlKey: true });
    expect(onOpenCard).not.toHaveBeenCalled();
  });

  it('drag and drop still moves the card, and opens nothing', () => {
    const onMove = vi.fn();
    const onOpenCard = vi.fn();
    render(<KanbanBoard columns={columns} onMove={onMove} onOpenCard={onOpenCard} />);
    const dataTransfer = fakeDataTransfer();
    fireEvent.dragStart(cardOf('Alpha'), { dataTransfer });
    fireEvent.drop(screen.getByRole('region', { name: 'Contacted' }), { dataTransfer });
    expect(onMove).toHaveBeenCalledWith({ cardId: 1, fromColumnId: 'new', toColumnId: 'contacted', index: 1 });
    expect(onOpenCard).not.toHaveBeenCalled();
  });

  it('cards carry kb-enter with their index in the column, kb-lift, and the openable class', () => {
    render(<KanbanBoard columns={columns} onMove={() => undefined} onOpenCard={() => undefined} />);
    expect(cardOf('Alpha')).toHaveClass('kb-enter', 'kb-lift', 'kb-kanban__card--openable');
    expect(cardOf('Alpha').style.getPropertyValue('--i')).toBe('0');
    expect(cardOf('Bravo').style.getPropertyValue('--i')).toBe('1');
    expect(cardOf('Cara').style.getPropertyValue('--i')).toBe('0');
  });

  it('without onOpenCard the cards are not marked openable', () => {
    render(<KanbanBoard columns={columns} onMove={() => undefined} />);
    expect(cardOf('Alpha')).not.toHaveClass('kb-kanban__card--openable');
  });

  it('drops the entrance after it finishes, so a drop or reorder never replays it', () => {
    vi.useFakeTimers();
    try {
      const { container, rerender } = render(
        <KanbanBoard columns={columns} onMove={() => undefined} />,
      );
      expect(cardOf('Alpha')).toHaveClass('kb-enter');
      act(() => {
        vi.advanceTimersByTime(ENTER_TOTAL_MS);
      });
      rerender(<KanbanBoard columns={reordered} onMove={() => undefined} />);
      const cards = container.querySelectorAll<HTMLElement>('.kb-kanban__card');
      expect(cards).toHaveLength(3);
      for (const card of cards) {
        expect(card).not.toHaveClass('kb-enter');
        expect(card.style.getPropertyValue('--i')).toBe('');
      }
    } finally {
      vi.useRealTimers();
    }
  });
});
