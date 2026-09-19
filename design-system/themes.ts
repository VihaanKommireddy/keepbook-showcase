/**
 * Theme registry + apply/persist logic (Appearance picker).
 *
 * Keepbook ships exactly TWO themes — Light (the warm-paper brand look) and
 * Dark (the clean charcoal-green companion). The two keys below are the ONLY
 * valid `data-theme` values the app ever sets; each names a complete token
 * block in ds/tokens.css. The Settings "Appearance" picker renders directly
 * from THEMES — nothing about theme names/descriptions/swatches lives
 * anywhere else, so the picker can never drift out of sync with what
 * tokens.css actually ships. Light is the default on every device.
 */

export type ThemeKey = 'light' | 'dark';

export interface ThemeSwatch {
  bg: string;
  surface: string;
  accent: string;
}

export interface ThemeMeta {
  key: ThemeKey;
  name: string;
  description: string;
  swatch: ThemeSwatch;
}

/** Swatch hex values are read straight off each theme's tokens.css block —
 *  duplicated here (not computed at runtime) so the picker can render its
 *  swatches before the DOM has painted the chosen theme. This file and
 *  tokens.css are the only two places raw hex is allowed outside a CSS
 *  custom-property declaration. */
export const THEMES: readonly ThemeMeta[] = [
  {
    key: 'light',
    name: 'Light',
    description: 'Warm cream paper and spruce green — the original Keepbook look, easy on the eyes in daylight.',
    swatch: { bg: '#f7f6f2', surface: '#ffffff', accent: '#226a4b' },
  },
  {
    key: 'dark',
    name: 'Dark',
    description: 'A calm charcoal-green for low light — the same spruce accent, inverted for night work.',
    swatch: { bg: '#121917', surface: '#1a2320', accent: '#4fb284' },
  },
];

const THEME_KEYS = new Set<string>(THEMES.map((t) => t.key));

export function isThemeKey(value: string | null | undefined): value is ThemeKey {
  return value !== null && value !== undefined && THEME_KEYS.has(value);
}

/** localStorage key for the user's saved device preference. */
export const THEME_STORAGE_KEY = 'kb-theme';

/** Keepbook defaults to Light for everyone. A device only shows Dark once the
 *  user explicitly picks it in Settings → Appearance. */
const DEFAULT_THEME: ThemeKey = 'light';

/** The theme the app lands on with no explicit choice saved yet. */
export function defaultTheme(): ThemeKey {
  return DEFAULT_THEME;
}

function readStoredTheme(): ThemeKey | null {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeKey(stored) ? stored : null;
  } catch {
    return null;
  }
}

/** Paints data-theme on <html> only — no localStorage write. */
function paint(key: ThemeKey): void {
  document.documentElement.dataset.theme = key;
}

/**
 * Runs once at boot, from main.tsx (the prod CSP forbids inline scripts, so
 * this can't live in index.html). An explicit saved choice wins; otherwise
 * the app lands on Light. tokens.css's bare `:root` already paints the Light
 * palette for the instant before this runs.
 */
export function initTheme(): void {
  paint(readStoredTheme() ?? defaultTheme());
}

/** The theme currently painted on <html> — reads the live DOM attribute
 *  (already set by initTheme() before React mounts), not storage, so it's
 *  always correct including the very first render of the picker. */
export function getActiveTheme(): ThemeKey {
  const current = document.documentElement.dataset.theme;
  return isThemeKey(current) ? current : defaultTheme();
}

/**
 * The user's explicit choice from the Appearance picker: paints <html>
 * immediately — the whole app recolors instantly, it's just the data-theme
 * attribute — and remembers it on this device. Never throws if storage is
 * unavailable (private browsing, quota); the theme still applies for the
 * rest of this session.
 */
export function applyTheme(key: ThemeKey): void {
  paint(key);
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, key);
  } catch {
    // Storage unavailable — theme still applied for this session.
  }
}
