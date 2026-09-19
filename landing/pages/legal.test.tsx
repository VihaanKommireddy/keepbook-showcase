/**
 * The legal pages must not drift from the documents they publish (round 2 §4).
 * PRIVACY.md and TERMS.md at the repo root are the source of truth; these
 * pages are their JSX transcription, so this test reads both files and
 * asserts, line by line, that everything in them reached the page:
 *  - the `# ` title is the page's only h1;
 *  - every `## ` heading is an h2 with the same text, in the same order;
 *  - the effective date matches;
 *  - every other non-blank line's plain text appears in the rendered page,
 *    including each cell of the provider table and each all-caps paragraph.
 * A paragraph edited in the .md and forgotten on the page fails here.
 */
import type { JSX } from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import PrivacyPage from './PrivacyPage';
import TermsPage from './TermsPage';

afterEach(cleanup);

// Under jsdom, Vite rewrites import.meta.url to an http://localhost dev-server
// URL (not file://), so new URL(relative, import.meta.url) resolves off the
// filesystem entirely and readFileSync rejects it ("must be of scheme file").
// process.cwd() is the repo root under the vitest workspace — same pattern
// ds/components/a11y-fixes.test.tsx uses to read a source file directly.
const PRIVACY = readFileSync(join(process.cwd(), 'PRIVACY.md'), 'utf8');
const TERMS = readFileSync(join(process.cwd(), 'TERMS.md'), 'utf8');

/** Markdown line → the plain text it should read as on the page. */
function plainText(line: string): string {
  return line
    .replace(/^#{1,6}\s+/, '')
    .replace(/^[-*]\s+/, '')
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Every chunk of a markdown line that must appear on the page. A table row
 *  contributes one chunk per cell; the |---|---| separator contributes none. */
function chunksOf(line: string): string[] {
  const trimmed = line.trim();
  if (trimmed === '') return [];
  if (/^\|[\s:|-]+\|$/.test(trimmed)) return [];
  if (trimmed.startsWith('|')) {
    return trimmed
      .split('|')
      .map((cell) => plainText(cell))
      .filter((cell) => cell !== '');
  }
  const text = plainText(trimmed);
  return text === '' ? [] : [text];
}

function headingsOf(markdown: string): string[] {
  return markdown
    .split('\n')
    .filter((line) => line.startsWith('## '))
    .map((line) => line.slice(3).trim());
}

function titleOf(markdown: string): string {
  const line = markdown.split('\n').find((l) => l.startsWith('# '));
  if (line === undefined) throw new Error('no # title in the document');
  return line.slice(2).trim();
}

function effectiveOf(markdown: string): string {
  const match = /^\*\*Effective date:\*\*\s*(.+)$/m.exec(markdown);
  if (match === null || match[1] === undefined) throw new Error('no effective date in the document');
  return match[1].trim();
}

/** The page's visible text, whitespace collapsed, for substring checks. */
function pageText(container: HTMLElement): string {
  return (container.textContent ?? '').replace(/\s+/g, ' ');
}

const DOCS: [string, string, () => JSX.Element, string][] = [
  ['PRIVACY.md', PRIVACY, PrivacyPage, '/privacy'],
  ['TERMS.md', TERMS, TermsPage, '/terms'],
];

describe.each(DOCS)('%s renders faithfully', (_name, markdown, Page, path) => {
  function renderPage(): HTMLElement {
    const { container } = render(
      <MemoryRouter initialEntries={[path]}>
        <Page />
      </MemoryRouter>,
    );
    return container;
  }

  it('publishes the document title as the page’s only h1', () => {
    renderPage();
    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]?.textContent?.trim()).toBe(titleOf(markdown));
  });

  it('publishes every ## heading as an h2, verbatim and in order', () => {
    renderPage();
    const rendered = screen
      .getAllByRole('heading', { level: 2 })
      .map((h) => (h.textContent ?? '').replace(/\s+/g, ' ').trim());
    expect(rendered).toEqual(headingsOf(markdown));
  });

  it('publishes the effective date', () => {
    const container = renderPage();
    expect(pageText(container)).toContain(`Effective date: ${effectiveOf(markdown)}`);
  });

  it('publishes every other line of the document', () => {
    const container = renderPage();
    const text = pageText(container);
    const missing: string[] = [];
    for (const line of markdown.split('\n')) {
      for (const chunk of chunksOf(line)) {
        if (!text.includes(chunk)) missing.push(chunk);
      }
    }
    expect(missing).toEqual([]);
  });
});

describe('the legal pages’ chrome', () => {
  it('wears the landing masthead and the footer with Privacy and Terms', () => {
    render(
      <MemoryRouter initialEntries={['/privacy']}>
        <PrivacyPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Keepbook home' })).toHaveAttribute('href', '/');
    const footer = screen.getByRole('navigation', { name: 'Footer' });
    expect([...footer.querySelectorAll('a')].map((a) => a.textContent)).toEqual([
      'Privacy',
      'Terms',
      'Rates',
      'Log in',
      'Create your book',
    ]);
  });
});
