/**
 * Regression guards for the Phase-4 accessibility/visual defects owned by
 * Fixer C: A11Y-1 (Drawer restore-focus), A11Y-3 (Kanban restore-focus),
 * A11Y-5 (Input error role=alert), A11Y-6 (--ink-3 contrast), VIS-1 (Tabs
 * self-scroll). Each is written to FAIL against the pre-fix code.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { useState, type JSX } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { Drawer } from './Drawer';
import { KanbanBoard, type KanbanColumnData, type KanbanMove } from './Kanban';
import { TextField } from './Input';

// Vite stubs .css imports to '' in the test transform, so read the source files
// directly. process.cwd() is the repo root under the vitest workspace.
const tabsCss = readFileSync(join(process.cwd(), 'web/src/ds/components/Tabs.css'), 'utf8');
const tokensCss = readFileSync(join(process.cwd(), 'web/src/ds/tokens.css'), 'utf8');
const baseCss = readFileSync(join(process.cwd(), 'web/src/ds/base.css'), 'utf8');

afterEach(cleanup);

// ── A11Y-1: Drawer restores focus to the trigger on close ──────────────────

function DrawerHarness(): JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Add client
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Add client">
        <p>body</p>
      </Drawer>
    </>
  );
}

describe('A11Y-1 Drawer focus restoration', () => {
  it('returns focus to the opener when closed via the X button', async () => {
    const user = userEvent.setup();
    render(<DrawerHarness />);
    const trigger = screen.getByRole('button', { name: 'Add client' });
    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(document.activeElement).toBe(trigger);
  });

  it('returns focus to the opener on Esc (dialog cancel)', async () => {
    const user = userEvent.setup();
    render(<DrawerHarness />);
    const trigger = screen.getByRole('button', { name: 'Add client' });
    await user.click(trigger);
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));
    expect(document.activeElement).toBe(trigger);
  });
});

// ── A11Y-3: Kanban keeps focus on the moved card ───────────────────────────

function KanbanHarness(): JSX.Element {
  const [columns, setColumns] = useState<KanbanColumnData[]>([
    { id: 'new', name: 'New', cards: [{ id: 1, title: 'Alpha' }, { id: 2, title: 'Bravo' }] },
    { id: 'contacted', name: 'Contacted', cards: [{ id: 3, title: 'Cara' }] },
  ]);
  const onMove = (m: KanbanMove): void => {
    setColumns((cols) => {
      const card = cols.flatMap((c) => c.cards).find((c) => c.id === m.cardId);
      if (card === undefined) return cols;
      const next = cols.map((c) => ({ ...c, cards: c.cards.filter((x) => x.id !== m.cardId) }));
      const dest = next.find((c) => c.id === m.toColumnId);
      dest?.cards.splice(m.index, 0, card);
      return next;
    });
  };
  return <KanbanBoard columns={columns} onMove={onMove} />;
}

const cardOf = (title: string): HTMLElement =>
  screen.getByText(title).closest('[role="listitem"]') as HTMLElement;

describe('A11Y-3 Kanban focus restoration', () => {
  it('keeps focus on the card after a keyboard lift/move/drop', async () => {
    const user = userEvent.setup();
    render(<KanbanHarness />);
    cardOf('Alpha').focus();
    await user.keyboard(' '); // lift
    await user.keyboard('{ArrowRight}'); // over Contacted
    await user.keyboard(' '); // drop
    expect(document.activeElement).toBe(cardOf('Alpha'));
  });

  it('returns focus to the card when the move menu is dismissed with Esc', async () => {
    const user = userEvent.setup();
    render(<KanbanHarness />);
    cardOf('Bravo').focus();
    await user.keyboard('m'); // open "Move to…" menu
    await user.keyboard('{Escape}'); // dismiss
    expect(document.activeElement).toBe(cardOf('Bravo'));
  });
});

// ── A11Y-5: Input field error is a live region ─────────────────────────────

describe('A11Y-5 Input error announcement', () => {
  it('exposes the validation error via role="alert"', () => {
    render(<TextField label="First name" value="" onChange={() => undefined} error="First name is required" />);
    expect(screen.getByRole('alert')).toHaveTextContent('First name is required');
  });
});

// ── A11Y-6: --ink-3 clears WCAG AA on light --bg and --sunken ───────────────

function channelLin(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}
function luminance([r, g, b]: [number, number, number]): number {
  return 0.2126 * channelLin(r) + 0.7152 * channelLin(g) + 0.0722 * channelLin(b);
}
function toRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}
function contrast(fg: string, bg: string): number {
  const l1 = luminance(toRgb(fg));
  const l2 = luminance(toRgb(bg));
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

// tokens.css ships two named theme blocks (ds/themes.ts is the registry of
// the same two keys) — the Light default and the Dark override. These read a
// token out of each theme's own `[data-theme='<key>']` block.
const THEME_KEYS = ['light', 'dark'] as const;

function themeBlock(key: string): string {
  const m = tokensCss.match(new RegExp(`\\[data-theme='${key}'\\]\\s*\\{([^}]*)\\}`));
  if (m === null) throw new Error(`theme block for ${key} not found in tokens.css`);
  return m[1] as string;
}
function tokenIn(block: string, name: string): string {
  const m = block.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (m === null) throw new Error(`token ${name} not found`);
  return m[1] as string;
}

describe('A11Y-6 --ink-3 contrast, every theme (THEMES)', () => {
  it('locks in the darkened Light-theme hex (the original A11Y-6 fix)', () => {
    const ink3 = tokenIn(themeBlock('light'), '--ink-3');
    expect(ink3.toLowerCase()).toBe('#5f6b64');
  });

  it.each(THEME_KEYS)('%s: --ink-3 clears AA 4.5:1 on --bg and --sunken', (key) => {
    const block = themeBlock(key);
    const ink3 = tokenIn(block, '--ink-3');
    const bg = tokenIn(block, '--bg');
    const sunken = tokenIn(block, '--sunken');
    expect(contrast(ink3, bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(ink3, sunken)).toBeGreaterThanOrEqual(4.5);
  });
});

// ── APP-UI (2026-09-14): --ink on --accent-soft clears AA in both themes ────

describe('APP-UI --accent-soft contrast, every theme', () => {
  /** `--accent-soft: color-mix(in srgb, var(--accent) N%, var(--surface))` →
   *  the mixed channels. color-mix in srgb is a plain per-channel blend of the
   *  gamma-encoded values, so N% accent + (100−N)% surface is the paint. */
  function accentSoft(block: string): [number, number, number] {
    const m = block.match(/--accent-soft:\s*color-mix\(in srgb, var\(--accent\) (\d+)%, var\(--surface\)\)/);
    if (m === null) throw new Error('--accent-soft is not the expected color-mix of --accent into --surface');
    const pct = Number(m[1]) / 100;
    const accent = toRgb(tokenIn(block, '--accent'));
    const surface = toRgb(tokenIn(block, '--surface'));
    const mix = (i: 0 | 1 | 2): number => Math.round(accent[i] * pct + surface[i] * (1 - pct));
    return [mix(0), mix(1), mix(2)];
  }

  it.each(THEME_KEYS)('%s: --ink clears AA 4.5:1 on --accent-soft', (key) => {
    const block = themeBlock(key);
    const ink = luminance(toRgb(tokenIn(block, '--ink')));
    const soft = luminance(accentSoft(block));
    const ratio = (Math.max(ink, soft) + 0.05) / (Math.min(ink, soft) + 0.05);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('mixes 9% accent in light and 12% in dark, as specced', () => {
    expect(themeBlock('light')).toMatch(/--accent-soft:\s*color-mix\(in srgb, var\(--accent\) 9%, var\(--surface\)\)/);
    expect(themeBlock('dark')).toMatch(/--accent-soft:\s*color-mix\(in srgb, var\(--accent\) 12%, var\(--surface\)\)/);
  });
});

// ── APP-UI: the type scale and the motion primitives are what the spec says ─

describe('APP-UI tokens and motion primitives', () => {
  it('type scale is up one notch (base 15/22 … 2xl 30/34)', () => {
    expect(tokensCss).toMatch(/--text-base-size:\s*15px/);
    expect(tokensCss).toMatch(/--text-base-lh:\s*22px/);
    expect(tokensCss).toMatch(/--text-md-size:\s*17px/);
    expect(tokensCss).toMatch(/--text-lg-size:\s*22px/);
    expect(tokensCss).toMatch(/--text-xl-size:\s*24px/);
    expect(tokensCss).toMatch(/--text-2xl-size:\s*30px/);
    expect(tokensCss).toMatch(/--text-2xl-lh:\s*34px/);
  });

  it('defines the pop easing and the lift shadow in both themes', () => {
    expect(tokensCss).toMatch(/--ease-pop:\s*cubic-bezier\(0\.2, 0\.8, 0\.2, 1\)/);
    expect(tokensCss).toMatch(/--motion-pop:\s*420ms var\(--ease-pop\)/);
    expect(themeBlock('light')).toMatch(/--shadow-lift:/);
    expect(themeBlock('dark')).toMatch(/--shadow-lift:/);
  });

  it('kb-enter staggers by --i, capped at 12 × 40ms, only when motion is allowed', () => {
    const noPref = baseCss.indexOf('@media (prefers-reduced-motion: no-preference)');
    expect(noPref).toBeGreaterThan(-1);
    const enter = baseCss.indexOf('.kb-enter {');
    expect(enter).toBeGreaterThan(noPref);
    expect(baseCss).toContain('animation-delay: calc(min(var(--i, 0), 12) * 40ms)');
    expect(baseCss).toContain('.kb-lift:hover');
    expect(baseCss).toContain('@keyframes kb-pop');
  });
});

// ── VIS-1: Tabs strip self-scrolls instead of pushing the body ─────────────

describe('VIS-1 Tabs self-scroll', () => {
  it('.kb-tabs__list declares an overflow-x scroll container', () => {
    const block = tabsCss.match(/\.kb-tabs__list\s*\{([^}]*)\}/);
    expect(block).not.toBeNull();
    expect(block?.[1]).toMatch(/overflow-x:\s*auto/);
  });
});
