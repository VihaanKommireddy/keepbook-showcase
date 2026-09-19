/**
 * SectionNav (app UI refresh, task 10 — lean nav): the underline strip that
 * lets a hidden-from-sidebar page (Rate changes, Policies, Service) surface
 * as a tab under its parent (Autopilot, Clients). Styled like Tabs.css but
 * these are real links (NavLink), not a tablist — no roving tabindex needed.
 */
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { SectionNav, activeSectionIndex } from './SectionNav';

afterEach(cleanup);

describe('SectionNav', () => {
  it('renders every item and marks the current route link aria-current="page"', () => {
    render(
      <MemoryRouter initialEntries={['/changes']}>
        <SectionNav
          items={[
            { label: 'Autopilot', to: '/autopilot' },
            { label: 'Rate changes', to: '/changes' },
          ]}
        />
      </MemoryRouter>,
    );

    const autopilotLink = screen.getByRole('link', { name: 'Autopilot' });
    const changesLink = screen.getByRole('link', { name: 'Rate changes' });
    expect(autopilotLink).toBeInTheDocument();
    expect(changesLink).toBeInTheDocument();
    expect(changesLink).toHaveAttribute('aria-current', 'page');
    expect(autopilotLink).not.toHaveAttribute('aria-current');
  });

  it('renders as a labeled nav landmark', () => {
    render(
      <MemoryRouter initialEntries={['/clients']}>
        <SectionNav
          items={[
            { label: 'Clients', to: '/clients' },
            { label: 'Policies', to: '/book' },
            { label: 'Service', to: '/tickets' },
          ]}
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole('navigation', { name: 'Section' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Clients' })).toHaveAttribute('aria-current', 'page');
  });

  it('a query item wins when its tab is the one showing; the bare item owns the rest', () => {
    const items = [
      { label: 'Queue', to: '/autopilot' },
      { label: 'Runs', to: '/autopilot?tab=runs' },
      { label: 'Settings', to: '/autopilot?tab=settings' },
    ];
    expect(activeSectionIndex(items, '/autopilot', '')).toBe(0);
    expect(activeSectionIndex(items, '/autopilot', '?tab=queue')).toBe(0);
    expect(activeSectionIndex(items, '/autopilot', '?tab=nonsense')).toBe(0);
    expect(activeSectionIndex(items, '/autopilot', '?tab=runs')).toBe(1);
    expect(activeSectionIndex(items, '/autopilot', '?tab=settings')).toBe(2);
    expect(activeSectionIndex(items, '/changes', '?tab=runs')).toBe(-1);
  });

  it('the longest matching path wins, and children count', () => {
    const items = [
      { label: 'Board', to: '/pipeline' },
      { label: 'Parked', to: '/pipeline/parked' },
      { label: 'Manage', to: '/pipeline/manage' },
    ];
    expect(activeSectionIndex(items, '/pipeline', '')).toBe(0);
    expect(activeSectionIndex(items, '/pipeline/parked', '')).toBe(1);
    expect(activeSectionIndex(items, '/pipeline/manage', '')).toBe(2);
    expect(activeSectionIndex(items, '/pipeline/leads/5', '')).toBe(0);
    expect(activeSectionIndex([{ label: 'Import', to: '/import' }], '/import/az', '')).toBe(0);
    expect(activeSectionIndex([{ label: 'Settings', to: '/settings' }], '/templates', '')).toBe(-1);
  });

  it('marks the query item aria-current when the URL carries its tab', () => {
    render(
      <MemoryRouter initialEntries={['/autopilot?tab=runs']}>
        <SectionNav
          items={[
            { label: 'Queue', to: '/autopilot' },
            { label: 'Runs', to: '/autopilot?tab=runs' },
          ]}
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Runs' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Queue' })).not.toHaveAttribute('aria-current');
  });
});
