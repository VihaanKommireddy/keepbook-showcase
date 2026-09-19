/**
 * SectionNav (app UI refresh task 10 — lean nav; query-aware in round 2 §1):
 * a page that is not its own sidebar row surfaces as a tab strip on its
 * parent and on itself, styled like Tabs.css's underline (same tokens) but
 * built from real links — these are separate pages/routes, not one tabpanel,
 * so no role="tablist"/roving-tabindex: browser link semantics already give
 * keyboard users Tab + Enter.
 *
 * Round 2: an item's `to` may carry a query ('/autopilot?tab=runs'), which
 * NavLink cannot match — it compares pathnames only and derives aria-current
 * from its own match, which cannot be handed to it from outside. So these are
 * plain `Link`s that carry aria-current explicitly, and `activeSectionIndex`
 * below is the ONE rule for "which item is the page showing". It is exported
 * because app/sections.ts's sidebar highlight has to reach the same answer;
 * two rules for one question is how a rail and a tab strip drift apart.
 */
import type { JSX } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './SectionNav.css';

export interface SectionNavItem {
  label: string;
  /** Where the tab goes. May carry a `?tab=` query. */
  to: string;
}

export interface SectionNavProps {
  items: readonly SectionNavItem[];
  className?: string;
}

/** The path half of an item's `to` ('/autopilot?tab=runs' → '/autopilot'). */
export function sectionPathOf(to: string): string {
  const q = to.indexOf('?');
  return q === -1 ? to : to.slice(0, q);
}

/** The `tab` value an item pins, or null when it pins none. */
function sectionTabOf(to: string): string | null {
  const q = to.indexOf('?');
  return q === -1 ? null : new URLSearchParams(to.slice(q + 1)).get('tab');
}

/** Does `to`'s path own `pathname` — itself or a child of it? */
function pathMatches(to: string, pathname: string): boolean {
  const path = sectionPathOf(to);
  return pathname === path || pathname.startsWith(`${path}/`);
}

/**
 * Which item in `items` is the page currently showing, or -1 for none
 * (Templates renders the Settings row with nothing active — spec §1).
 *
 * Two passes, in this order:
 *  1. An item that PINS a tab wins outright when that tab is the one in the
 *     URL: /autopilot?tab=runs is Runs, never Queue.
 *  2. Otherwise, the longest matching path among the items that pin no tab.
 *     That makes /pipeline/parked Parked rather than Board, /import/az
 *     Import, and /book/tags Policies.
 * A URL with no `tab`, or with a `tab` no sibling claims, therefore lands on
 * the tab-less item for that path — Queue owns /autopilot, ?tab=queue, and
 * the nonsense value AutopilotPage itself falls back to queue on.
 */
export function activeSectionIndex(
  items: readonly SectionNavItem[],
  pathname: string,
  search: string,
): number {
  const tab = new URLSearchParams(search).get('tab');
  if (tab !== null) {
    const pinned = items.findIndex(
      (item) => pathMatches(item.to, pathname) && sectionTabOf(item.to) === tab,
    );
    if (pinned !== -1) return pinned;
  }
  let best = -1;
  let bestLength = -1;
  items.forEach((item, i) => {
    if (sectionTabOf(item.to) !== null) return;
    if (!pathMatches(item.to, pathname)) return;
    const length = sectionPathOf(item.to).length;
    if (length > bestLength) {
      bestLength = length;
      best = i;
    }
  });
  return best;
}

export function SectionNav({ items, className }: SectionNavProps): JSX.Element {
  const { pathname, search } = useLocation();
  const active = activeSectionIndex(items, pathname, search);
  return (
    <nav aria-label="Section" className={['kb-sectionnav', className ?? ''].filter(Boolean).join(' ')}>
      {items.map((item, i) => (
        <Link
          key={item.to}
          to={item.to}
          className={`kb-sectionnav__link${i === active ? ' kb-sectionnav__link--active' : ''}`}
          {...(i === active ? { 'aria-current': 'page' as const } : {})}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
