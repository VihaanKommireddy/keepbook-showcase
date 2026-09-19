/**
 * FilterButton + FilterPanel (app UI round 2 §3): the pattern Policies had
 * privately, lifted so every list can wear it — one button that says how many
 * filters are on, and the panel it opens. Nothing is hidden by them: the
 * applied filters still render as chips on the toolbar either way.
 */
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type JSX } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FilterButton, FilterPanel } from './FilterBar';

afterEach(cleanup);

describe('FilterButton', () => {
  it('says "Filters" with nothing applied and "Filters · n" with some', () => {
    const { rerender } = render(
      <FilterButton count={0} open={false} onToggle={() => {}} panelId="p" />,
    );
    expect(screen.getByRole('button').textContent).toBe('Filters');
    rerender(<FilterButton count={2} open={false} onToggle={() => {}} panelId="p" />);
    expect(screen.getByRole('button').textContent).toBe('Filters · 2');
  });

  it('carries aria-expanded and aria-controls, and toggles on click', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<FilterButton count={0} open onToggle={onToggle} panelId="kb-panel" />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(button).toHaveAttribute('aria-controls', 'kb-panel');
    await user.click(button);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});

describe('FilterPanel', () => {
  it('renders nothing while closed and the panel, by id, while open', () => {
    const { container, rerender } = render(
      <FilterPanel id="kb-panel" open={false}>
        <p>Status</p>
      </FilterPanel>,
    );
    expect(container.querySelector('#kb-panel')).toBeNull();
    rerender(
      <FilterPanel id="kb-panel" open>
        <p>Status</p>
      </FilterPanel>,
    );
    const panel = container.querySelector('#kb-panel');
    expect(panel).not.toBeNull();
    expect(panel).toHaveClass('kb-filterpanel');
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('the button opens the panel it names', async () => {
    const user = userEvent.setup();
    function Harness(): JSX.Element {
      const [open, setOpen] = useState(false);
      return (
        <>
          <FilterButton count={1} open={open} onToggle={() => setOpen((o) => !o)} panelId="kb-panel" />
          <FilterPanel id="kb-panel" open={open}>
            <p>Status</p>
          </FilterPanel>
        </>
      );
    }
    render(<Harness />);
    expect(screen.queryByText('Status')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Filters · 1' }));
    expect(screen.getByText('Status')).toBeInTheDocument();
  });
});
