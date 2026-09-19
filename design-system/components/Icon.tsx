/**
 * Inline SVG icon set (DESIGN-SYSTEM §4): 16px grid, 1.5px stroke,
 * currentColor, round caps. Hand-set line art — no icon fonts, no emoji,
 * no third-party packs. Decorative by default (aria-hidden); pass `label`
 * for meaningful icons.
 */
import type { JSX } from 'react';

export type IconName =
  | 'today'
  | 'clients'
  | 'book'
  | 'pipeline'
  | 'renewals'
  | 'radar'
  | 'service'
  | 'reports'
  | 'goals'
  | 'settings'
  | 'add'
  | 'import'
  | 'export'
  | 'calendar'
  | 'phone'
  | 'mail'
  | 'sms'
  | 'search'
  | 'filter'
  | 'sort'
  | 'undo'
  | 'warning'
  | 'check'
  | 'x'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'more'
  | 'drag'
  | 'admin';

const PATHS: Record<IconName, JSX.Element> = {
  // sun-and-horizon: the day ahead
  today: (
    <>
      <circle cx="8" cy="8" r="3" />
      <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4" />
    </>
  ),
  book: (
    <>
      <path d="M2.5 2.5h4.5a1.5 1.5 0 0 1 1.5 1.5v9.5a1.5 1.5 0 0 0-1.5-1.5H2.5z" />
      <path d="M13.5 2.5H9a1.5 1.5 0 0 0-1.5 1.5v9.5A1.5 1.5 0 0 1 9 12h4.5z" />
    </>
  ),
  // two people — the client roster
  clients: (
    <>
      <circle cx="6" cy="5" r="2.25" />
      <path d="M2 14v-1a4 4 0 0 1 4-4 4 4 0 0 1 4 4v1" />
      <path d="M10.75 3.75a2.25 2.25 0 0 1 0 4.3" />
      <path d="M12.5 8.7A4 4 0 0 1 14 12v1" />
    </>
  ),
  // three kanban columns
  pipeline: (
    <>
      <rect x="1.5" y="2.5" width="3.5" height="8" rx="1" />
      <rect x="6.25" y="2.5" width="3.5" height="11" rx="1" />
      <rect x="11" y="2.5" width="3.5" height="5" rx="1" />
    </>
  ),
  // calendar with a cycle arrow
  renewals: (
    <>
      <rect x="1.5" y="3" width="13" height="11" rx="1.5" />
      <path d="M4.5 1.5v3M11.5 1.5v3M1.5 6.5h13" />
      <path d="M6 10.5a2.2 2.2 0 0 1 4-1M10 11a2.2 2.2 0 0 1-4 1" />
    </>
  ),
  // radar arcs + sweep
  radar: (
    <>
      <path d="M8 8L12.5 3.5" />
      <path d="M11 8a3 3 0 1 1-3-3" />
      <path d="M14 8a6 6 0 1 1-6-6" />
      <circle cx="8" cy="8" r="0.5" fill="currentColor" />
    </>
  ),
  // wrench
  service: (
    <>
      <path d="M9.5 6.5 13 3a3.5 3.5 0 0 0-4.8 4.2L3 12.4a1.6 1.6 0 1 0 2.3 2.3l5.2-5.2A3.5 3.5 0 0 0 14.7 4.7L11 8.5z" />
    </>
  ),
  // bar chart
  reports: (
    <>
      <path d="M2 14h12" />
      <path d="M4 14V9M8 14V4M12 14V6.5" />
    </>
  ),
  // target
  goals: (
    <>
      <circle cx="8" cy="8" r="6" />
      <circle cx="8" cy="8" r="3" />
      <circle cx="8" cy="8" r="0.5" fill="currentColor" />
    </>
  ),
  // gear
  settings: (
    <>
      <circle cx="8" cy="8" r="2.25" />
      <path d="M8 1.75v2M8 12.25v2M1.75 8h2M12.25 8h2M3.6 3.6l1.4 1.4M11 11l1.4 1.4M12.4 3.6 11 5M5 11l-1.4 1.4" />
    </>
  ),
  add: <path d="M8 3v10M3 8h10" />,
  // arrow into tray
  import: (
    <>
      <path d="M8 2v7.5M5 7l3 3 3-3" />
      <path d="M2 11v2a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-2" />
    </>
  ),
  export: (
    <>
      <path d="M8 10V2.5M5 5l3-3 3 3" />
      <path d="M2 11v2a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-2" />
    </>
  ),
  calendar: (
    <>
      <rect x="1.5" y="3" width="13" height="11" rx="1.5" />
      <path d="M4.5 1.5v3M11.5 1.5v3M1.5 6.5h13" />
    </>
  ),
  phone: (
    <path d="M3.2 1.8h2.6l1.2 3.2-1.7 1.3a9.5 9.5 0 0 0 4.4 4.4l1.3-1.7 3.2 1.2v2.6a1.2 1.2 0 0 1-1.3 1.2A12.8 12.8 0 0 1 2 3.1a1.2 1.2 0 0 1 1.2-1.3z" />
  ),
  mail: (
    <>
      <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" />
      <path d="m2 4.5 6 4.5 6-4.5" />
    </>
  ),
  // speech bubble
  sms: (
    <path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h9A1.5 1.5 0 0 1 14 3.5v6a1.5 1.5 0 0 1-1.5 1.5H6l-4 3z" />
  ),
  search: (
    <>
      <circle cx="7" cy="7" r="4.5" />
      <path d="m10.5 10.5 3.5 3.5" />
    </>
  ),
  filter: <path d="M2 3h12L9.5 8.5V13l-3 1.5V8.5z" />,
  sort: (
    <>
      <path d="M5 2.5v11M2.5 5 5 2.5 7.5 5" />
      <path d="M11 13.5v-11M8.5 11l2.5 2.5L13.5 11" />
    </>
  ),
  undo: (
    <>
      <path d="M2.5 4v4h4" />
      <path d="M2.9 8A5.5 5.5 0 1 1 4 11.5" />
    </>
  ),
  warning: (
    <>
      <path d="M8 2 14.5 13.5h-13z" />
      <path d="M8 6.5v3.5" />
      <circle cx="8" cy="12" r="0.5" fill="currentColor" />
    </>
  ),
  check: <path d="m2.5 8.5 3.5 3.5 7.5-8" />,
  x: <path d="m3.5 3.5 9 9M12.5 3.5l-9 9" />,
  'chevron-down': <path d="m3.5 6 4.5 4.5L12.5 6" />,
  'chevron-left': <path d="M10 3.5 5.5 8l4.5 4.5" />,
  'chevron-right': <path d="m6 3.5 4.5 4.5L6 12.5" />,
  more: (
    <>
      <circle cx="3" cy="8" r="0.75" fill="currentColor" />
      <circle cx="8" cy="8" r="0.75" fill="currentColor" />
      <circle cx="13" cy="8" r="0.75" fill="currentColor" />
    </>
  ),
  drag: (
    <>
      <circle cx="6" cy="4" r="0.75" fill="currentColor" />
      <circle cx="10" cy="4" r="0.75" fill="currentColor" />
      <circle cx="6" cy="8" r="0.75" fill="currentColor" />
      <circle cx="10" cy="8" r="0.75" fill="currentColor" />
      <circle cx="6" cy="12" r="0.75" fill="currentColor" />
      <circle cx="10" cy="12" r="0.75" fill="currentColor" />
    </>
  ),
  // shield with a check — the operator/admin area
  admin: (
    <>
      <path d="M8 1.5l5 2v4c0 3.2-2.1 5.6-5 7-2.9-1.4-5-3.8-5-7v-4z" />
      <path d="M5.75 8l1.5 1.5 3-3.25" />
    </>
  ),
};

export const ICON_NAMES = Object.keys(PATHS) as IconName[];

export interface IconProps {
  name: IconName;
  /** Pixel size; default 16 (the grid). EmptyState glyphs use 40. */
  size?: number;
  /** Accessible label. Omit = decorative (aria-hidden). */
  label?: string;
  className?: string;
}

export function Icon({ name, size = 16, label, className }: IconProps): JSX.Element {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label !== undefined ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label === undefined ? true : undefined}
      className={className}
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
