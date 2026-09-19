/**
 * DataTable single-click open (app UI refresh §5, QA finding LOCAL-01), the
 * shouldOpenFromClick guards, and the kb-enter stagger on the first 12 rows.
 */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ENTER_TOTAL_MS } from '../motion';
import { DataTable, shouldOpenFromClick, type ColumnDef } from './Table';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

interface Row {
  id: number;
  name: string;
}

const rows: Row[] = [
  { id: 1, name: 'Marisol Ferry' },
  { id: 2, name: 'Dexter Callow' },
];

// A hash href keeps jsdom quiet (it implements hash navigation only).
const columns: ColumnDef<Row>[] = [
  { key: 'name', header: 'Client', link: true, render: (r) => <a href={`#client-${r.id}`}>{r.name}</a> },
  { key: 'id', header: 'Id', render: (r) => `#${r.id}` },
];

const bodyRow = (name: string): HTMLElement => screen.getByText(name).closest('tr') as HTMLElement;

describe('DataTable single-click open', () => {
  it('a plain click on a row calls onOpenRow with that row', () => {
    const onOpenRow = vi.fn();
    render(<DataTable columns={columns} rows={rows} rowKey={(r) => r.id} onOpenRow={onOpenRow} />);
    fireEvent.click(screen.getByText('#2'));
    expect(onOpenRow).toHaveBeenCalledTimes(1);
    expect(onOpenRow).toHaveBeenCalledWith(rows[1]);
  });

  it('a click on a link inside the row does not open the row', () => {
    const onOpenRow = vi.fn();
    render(<DataTable columns={columns} rows={rows} rowKey={(r) => r.id} onOpenRow={onOpenRow} />);
    fireEvent.click(screen.getByText('Marisol Ferry'));
    expect(onOpenRow).not.toHaveBeenCalled();
  });

  it('a modifier-click does not open the row', () => {
    const onOpenRow = vi.fn();
    render(<DataTable columns={columns} rows={rows} rowKey={(r) => r.id} onOpenRow={onOpenRow} />);
    fireEvent.click(screen.getByText('#2'), { metaKey: true });
    fireEvent.click(screen.getByText('#2'), { ctrlKey: true });
    fireEvent.click(screen.getByText('#2'), { shiftKey: true });
    fireEvent.click(screen.getByText('#2'), { altKey: true });
    expect(onOpenRow).not.toHaveBeenCalled();
  });

  it('Enter on a focused row still opens it', async () => {
    const user = userEvent.setup();
    const onOpenRow = vi.fn();
    render(<DataTable columns={columns} rows={rows} rowKey={(r) => r.id} onOpenRow={onOpenRow} />);
    bodyRow('Dexter Callow').focus();
    await user.keyboard('{Enter}');
    expect(onOpenRow).toHaveBeenCalledWith(rows[1]);
  });

  it('openable rows carry the pointer class; rows without onOpenRow do not', () => {
    const { rerender } = render(
      <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} onOpenRow={() => undefined} />,
    );
    expect(bodyRow('Dexter Callow')).toHaveClass('kb-table__row--openable');
    rerender(<DataTable columns={columns} rows={rows} rowKey={(r) => r.id} />);
    expect(bodyRow('Dexter Callow')).not.toHaveClass('kb-table__row--openable');
  });

  it('clicking the row adds no tab stop (the row keeps its roving tabindex)', () => {
    render(<DataTable columns={columns} rows={rows} rowKey={(r) => r.id} onOpenRow={() => undefined} />);
    expect(bodyRow('Marisol Ferry')).toHaveAttribute('tabindex', '0');
    expect(bodyRow('Dexter Callow')).toHaveAttribute('tabindex', '-1');
  });
});

describe('shouldOpenFromClick', () => {
  const target = document.createElement('td');
  const base = { defaultPrevented: false, button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, target };

  it('opens on a plain primary click', () => {
    expect(shouldOpenFromClick(base)).toBe(true);
  });

  it('does not open on the middle or right button', () => {
    expect(shouldOpenFromClick({ ...base, button: 1 })).toBe(false);
    expect(shouldOpenFromClick({ ...base, button: 2 })).toBe(false);
  });

  it('does not open while text is selected', () => {
    vi.spyOn(window, 'getSelection').mockReturnValue({
      type: 'Range',
      toString: () => 'Marisol',
    } as unknown as Selection);
    expect(shouldOpenFromClick(base)).toBe(false);
  });

  it('does not open when the event was already handled', () => {
    expect(shouldOpenFromClick({ ...base, defaultPrevented: true })).toBe(false);
  });
});

describe('DataTable selection cell', () => {
  it('a click on the checkbox cell, missing the box, does not open the row', () => {
    const onOpenRow = vi.fn();
    const { container } = render(
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        onOpenRow={onOpenRow}
        selectable
        selected={new Set<number>()}
        onSelectedChange={() => undefined}
      />,
    );
    // The <th> of the same class is the header's; take the first body cell.
    const cell = container.querySelector('tbody .kb-table__checkcol');
    if (cell === null) throw new Error('no checkbox cell rendered');
    fireEvent.click(cell);
    expect(onOpenRow).not.toHaveBeenCalled();
  });
});

describe('DataTable row entrance', () => {
  it('the first 12 rows get kb-enter with their index as --i; later rows get no delay', () => {
    const many: Row[] = Array.from({ length: 14 }, (_, i) => ({ id: i + 1, name: `Row ${i + 1}` }));
    render(<DataTable columns={columns} rows={many} rowKey={(r) => r.id} />);
    expect(bodyRow('Row 1')).toHaveClass('kb-enter');
    expect(bodyRow('Row 1').style.getPropertyValue('--i')).toBe('0');
    expect(bodyRow('Row 12').style.getPropertyValue('--i')).toBe('11');
    expect(bodyRow('Row 13')).toHaveClass('kb-enter');
    expect(bodyRow('Row 13').style.getPropertyValue('--i')).toBe('');
  });

  it('drops the entrance after it finishes, so re-sorted rows never replay it', () => {
    vi.useFakeTimers();
    try {
      const many: Row[] = Array.from({ length: 14 }, (_, i) => ({ id: i + 1, name: `Row ${i + 1}` }));
      const { container, rerender } = render(
        <DataTable columns={columns} rows={many} rowKey={(r) => r.id} />,
      );
      expect(bodyRow('Row 1')).toHaveClass('kb-enter');
      act(() => {
        vi.advanceTimersByTime(ENTER_TOTAL_MS);
      });
      // A sort click hands the table the same rows in a different order.
      rerender(<DataTable columns={columns} rows={[...many].reverse()} rowKey={(r) => r.id} />);
      const bodyRows = container.querySelectorAll<HTMLElement>('tbody tr');
      expect(bodyRows).toHaveLength(14);
      for (const tr of bodyRows) {
        expect(tr).not.toHaveClass('kb-enter');
        expect(tr.style.getPropertyValue('--i')).toBe('');
      }
    } finally {
      vi.useRealTimers();
    }
  });
});
