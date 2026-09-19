/**
 * Theme registry + apply/persist tests (THEMES, 2026-08-16). Colocated with
 * ds/themes.ts, same pattern as ds/components/a11y-fixes.test.tsx.
 *
 * localStorage is stubbed with a Map-backed fake (same convention as
 * App.test.tsx / RootLayout.test.tsx / admin.test.tsx) rather than relying
 * on jsdom's real implementation, which this Node/jsdom combination doesn't
 * reliably provide.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  THEMES,
  THEME_STORAGE_KEY,
  applyTheme,
  getActiveTheme,
  initTheme,
  isThemeKey,
} from './themes';

beforeEach(() => {
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, v),
    removeItem: (k: string) => store.delete(k),
    clear: () => store.clear(),
  });
  document.documentElement.removeAttribute('data-theme');
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.documentElement.removeAttribute('data-theme');
});

describe('THEMES registry', () => {
  it('lists exactly the 2 named themes', () => {
    expect(THEMES).toHaveLength(2);
    expect(THEMES.map((t) => t.key)).toEqual(['light', 'dark']);
  });

  it('every theme has a name, a description, and a 3-color swatch', () => {
    for (const theme of THEMES) {
      expect(theme.name.length).toBeGreaterThan(0);
      expect(theme.description.length).toBeGreaterThan(0);
      expect(theme.swatch.bg).toMatch(/^#[0-9a-f]{6}$/i);
      expect(theme.swatch.surface).toMatch(/^#[0-9a-f]{6}$/i);
      expect(theme.swatch.accent).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

describe('isThemeKey', () => {
  it('accepts every registered key and rejects anything else', () => {
    for (const theme of THEMES) expect(isThemeKey(theme.key)).toBe(true);
    // The four pre-simplification keys are gone — only light / dark are valid now.
    expect(isThemeKey('warm-paper')).toBe(false);
    expect(isThemeKey('forest')).toBe(false);
    expect(isThemeKey('midnight-gold')).toBe(false);
    expect(isThemeKey('ink-gold-light')).toBe(false);
    expect(isThemeKey(null)).toBe(false);
    expect(isThemeKey(undefined)).toBe(false);
  });
});

describe('applyTheme', () => {
  it('sets data-theme on <html> and persists the choice to localStorage', () => {
    applyTheme('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('switching themes updates both the attribute and storage to the new key', () => {
    applyTheme('dark');
    applyTheme('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });
});

describe('getActiveTheme', () => {
  it('reads back whatever applyTheme just painted', () => {
    applyTheme('dark');
    expect(getActiveTheme()).toBe('dark');
  });

  it('falls back to a valid registered theme when the DOM attribute is absent', () => {
    expect(isThemeKey(getActiveTheme())).toBe(true);
  });
});

describe('initTheme', () => {
  it('applies a previously saved theme (explicit choice beats the default)', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    initTheme();
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('paints a valid default theme when nothing is saved yet', () => {
    initTheme();
    expect(isThemeKey(document.documentElement.dataset.theme)).toBe(true);
  });
});
