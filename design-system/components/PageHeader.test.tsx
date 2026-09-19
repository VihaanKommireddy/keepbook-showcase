/**
 * PageHeader (app UI refresh §2): eyebrow · title · meta · lede · actions,
 * each slot present only when given; the title is the page's one h1.
 */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { PageHeader } from './PageHeader';

afterEach(cleanup);

describe('PageHeader', () => {
  it('renders eyebrow, title, meta, lede and actions in their slots', () => {
    const { container } = render(
      <PageHeader
        eyebrow="Daily"
        title="Today"
        meta="Sep 14, 2026"
        lede="Every due step, with why it is here."
        actions={<button type="button">Add task</button>}
      />,
    );
    expect(container.querySelector('.kb-page__eyebrow')?.textContent).toBe('Daily');
    expect(screen.getByRole('heading', { level: 1, name: 'Today' })).toHaveClass('kb-page__title');
    expect(container.querySelector('.kb-page__meta')?.textContent).toBe('Sep 14, 2026');
    expect(container.querySelector('.kb-page__lede')?.textContent).toBe('Every due step, with why it is here.');
    expect(container.querySelector('.kb-page__actions')).toContainElement(
      screen.getByRole('button', { name: 'Add task' }),
    );
    expect(container.firstElementChild?.tagName).toBe('HEADER');
  });

  it('omits the empty slots entirely', () => {
    const { container } = render(<PageHeader title="Settings" />);
    expect(container.querySelector('.kb-page__eyebrow')).toBeNull();
    expect(container.querySelector('.kb-page__meta')).toBeNull();
    expect(container.querySelector('.kb-page__lede')).toBeNull();
    expect(container.querySelector('.kb-page__actions')).toBeNull();
  });

  it('the title is the page’s only h1', () => {
    render(<PageHeader eyebrow="System" title="Settings" lede="Everything about your agency." />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('passes className through to the header', () => {
    const { container } = render(<PageHeader title="Goals" className="v8g-head" />);
    expect(container.firstElementChild).toHaveClass('kb-page__head', 'v8g-head');
  });
});
