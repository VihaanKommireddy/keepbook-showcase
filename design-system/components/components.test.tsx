/**
 * Keyboard/a11y behavior smoke tests for the DS primitives.
 */
import { useState, type JSX } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Badge, TagChip } from './Badge';
import { Button } from './Button';
import { Card } from './Card';
import { DataTable } from './Table';
import { Tabs } from './Tabs';
import { TextField } from './Input';
import { buildMonthGrid } from './DatePicker';

afterEach(cleanup);

describe('Button', () => {
  it('working state swaps the label, disables, and sets aria-busy', () => {
    render(<Button variant="primary" working="Importing rows">Import</Button>);
    const btn = screen.getByRole('button', { name: 'Importing rows' });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
  });

  it('disabled buttons carry the reason as title', () => {
    render(<Button disabled disabledReason="Select rows to enable">Assign sequence</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('title', 'Select rows to enable');
  });
});

describe('Badge & TagChip', () => {
  it('badge carries the word, never color alone', () => {
    render(<Badge variant="red">lapsed</Badge>);
    expect(screen.getByText('lapsed')).toBeTruthy();
  });

  it('removable tag names itself in the remove label', () => {
    const onRemove = vi.fn();
    render(<TagChip name="renewal-june" onRemove={onRemove} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove tag renewal-june' }));
    expect(onRemove).toHaveBeenCalledOnce();
  });
});

describe('TextField', () => {
  it('links error text via aria-describedby and sets aria-invalid', () => {
    render(<TextField label="Email" value="" onChange={() => undefined} error="Bad email" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const describedBy = input.getAttribute('aria-describedby') ?? '';
    expect(document.getElementById(describedBy)?.textContent).toContain('Bad email');
  });
});

describe('Tabs', () => {
  it('arrow keys move and select with roving tabindex', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Tabs
        label="Sections"
        tabs={[
          { id: 'a', label: 'Overview' },
          { id: 'b', label: 'Policies' },
        ]}
        active="a"
        onChange={onChange}
      />,
    );
    const first = screen.getByRole('tab', { name: 'Overview' });
    expect(first).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Policies' })).toHaveAttribute('tabindex', '-1');
    first.focus();
    await user.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('switching tabs remounts the panel (it is keyed by the active tab)', async () => {
    const user = userEvent.setup();
    function Harness(): JSX.Element {
      const [active, setActive] = useState('a');
      return (
        <Tabs
          label="Sections"
          tabs={[
            { id: 'a', label: 'Overview' },
            { id: 'b', label: 'Policies' },
          ]}
          active={active}
          onChange={setActive}
        >
          <input aria-label="Note" defaultValue="" />
        </Tabs>
      );
    }
    render(<Harness />);
    const before = screen.getByRole('tabpanel');
    expect(before).toHaveClass('kb-tabs__panel--enter');
    await user.type(screen.getByLabelText('Note'), 'typed');
    await user.click(screen.getByRole('tab', { name: 'Policies' }));
    expect(screen.getByRole('tabpanel')).not.toBe(before);
    expect(screen.getByLabelText('Note')).toHaveValue('');
  });
});

describe('DataTable', () => {
  const rows = [
    { id: 1, name: 'Marisol Ferry' },
    { id: 2, name: 'Dexter Callow' },
  ];
  const columns = [{ key: 'name', header: 'Client', render: (r: { name: string }) => r.name }];

  it('renders a semantic table with sortable header buttons and aria-sort', () => {
    const onSortChange = vi.fn();
    render(
      <DataTable
        columns={[{ ...columns[0]!, sortable: true }]}
        rows={rows}
        rowKey={(r) => r.id}
        sort={{ key: 'name', dir: 'asc' }}
        onSortChange={onSortChange}
        countLabel="2 clients"
      />,
    );
    expect(screen.getByRole('table')).toBeTruthy();
    const th = screen.getByRole('columnheader', { name: /Client/ });
    expect(th).toHaveAttribute('aria-sort', 'ascending');
    fireEvent.click(screen.getByRole('button', { name: /Client/ }));
    expect(onSortChange).toHaveBeenCalledWith('name', 'desc');
  });

  it('roving rows: arrows move focus, Space selects, batch bar appears', async () => {
    const user = userEvent.setup();
    let selected = new Set<number | string>();
    const { rerender } = render(
      <DataTable
        columns={columns as never}
        rows={rows}
        rowKey={(r) => r.id}
        selectable
        selected={selected}
        onSelectedChange={(next) => {
          selected = next;
        }}
        batchBar={<button type="button">Tag</button>}
      />,
    );
    const bodyRows = screen.getAllByRole('row').slice(1);
    bodyRows[0]?.focus();
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(bodyRows[1]);
    await user.keyboard(' ');
    expect(selected.has(2)).toBe(true);
    rerender(
      <DataTable
        columns={columns as never}
        rows={rows}
        rowKey={(r) => r.id}
        selectable
        selected={selected}
        onSelectedChange={() => undefined}
        batchBar={<button type="button">Tag</button>}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('1 selected');
  });
});

describe('buildMonthGrid', () => {
  it('produces Monday-first full weeks covering the month', () => {
    const grid = buildMonthGrid('2026-08-15');
    expect(grid.length % 7).toBe(0);
    // 2026-08-01 is a Saturday → the grid starts Monday 2026-07-27.
    expect(grid[0]).toBe('2026-07-27');
    expect(grid).toContain('2026-08-01');
    expect(grid).toContain('2026-08-31');
  });
});

describe('Card', () => {
  it('interactive cards get the hover lift; plain cards do not', () => {
    const { container, rerender } = render(<Card>plain</Card>);
    expect(container.firstElementChild).not.toHaveClass('kb-lift');
    rerender(<Card interactive>target</Card>);
    expect(container.firstElementChild).toHaveClass('kb-lift', 'kb-card--interactive');
    rerender(<Card onClick={() => undefined}>clickable</Card>);
    expect(container.firstElementChild).toHaveClass('kb-lift');
  });

  it('a clickable card is a keyboard target: role button, focusable, Enter and Space activate it', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { container, rerender } = render(<Card onClick={onClick}>clickable</Card>);
    const card = container.firstElementChild;
    expect(card).toHaveAttribute('role', 'button');
    expect(card).toHaveAttribute('tabindex', '0');
    (card as HTMLElement).focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(2);
    rerender(<Card>plain</Card>);
    expect(container.firstElementChild).not.toHaveAttribute('role');
    expect(container.firstElementChild).not.toHaveAttribute('tabindex');
  });
});
