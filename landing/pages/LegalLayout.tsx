/**
 * The chrome both legal pages wear (round 2 §4): the landing's masthead and
 * footer around a 68ch measure. Public — a signed-out stranger and a signed-in
 * agent get the same page, so this lives beside LandingPage and reuses its
 * stylesheet rather than the app shell's.
 *
 * The pages inside are transcriptions of PRIVACY.md and TERMS.md at the repo
 * root. legal.test.tsx reads those files and fails if a line of either one is
 * missing from its page — edit the .md and the page together, always.
 */
import type { JSX, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import './landing.css';
import './legal.css';

export interface LegalLayoutProps {
  /** The document's `# ` title — the page's only h1. */
  title: string;
  /** The date after "Effective date:", exactly as the document states it. */
  /** The document's effective-date line. Omit for pages that are not dated documents. */
  effective?: string;
  children: ReactNode;
}

export function LegalLayout({ title, effective, children }: LegalLayoutProps): JSX.Element {
  return (
    <div className="kb-land kb-legal">
      <a href="#kb-legal-main" className="kb-skip-link">
        Skip to content
      </a>

      <header className="kb-land__masthead">
        <Link to="/" className="kb-land__wordmark" aria-label="Keepbook home">
          <span className="kb-land__mark" aria-hidden="true">
            K
          </span>
          <span>Keepbook</span>
        </Link>
        <nav className="kb-land__nav" aria-label="Site">
          <Link to="/login" className="kb-land__navlink">
            Log in
          </Link>
          <Link to="/signup" className="kb-btn kb-btn--primary kb-land__navcta">
            Create your book
          </Link>
        </nav>
      </header>

      <main id="kb-legal-main" className="kb-legal__main">
        <h1 className="kb-legal__title">{title}</h1>
        {effective !== undefined && (
          <p className="kb-legal__effective">
            <strong>Effective date:</strong> {effective}
          </p>
        )}
        {children}
      </main>

      <footer className="kb-land__footer">
        <p className="kb-land__footerbrand">Keepbook · Cary, North Carolina</p>
        <nav className="kb-land__footernav" aria-label="Footer">
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <a href="/rates">Rates</a>
          <Link to="/login">Log in</Link>
          <Link to="/signup">Create your book</Link>
        </nav>
        <p className="kb-land__footernote">Not affiliated with any insurance carrier or ratings bureau.</p>
      </footer>
    </div>
  );
}
