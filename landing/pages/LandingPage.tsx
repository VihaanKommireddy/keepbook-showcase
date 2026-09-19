/**
 * Public landing page (AUTH-SPEC "Web: landing + login + guarded shell").
 * Shown at '/' only while signed out — see RootLayout/AppOrLanding.
 *
 * "The desk" (redesign 2026-09-14): the page shows the shipped product and
 * nothing else. Three real screenshots of the app sit on the hero like papers
 * on a desk, pop in one after another on load, and drift apart a little as
 * you scroll — the only parallax on the page. Three small real UI states
 * float over them. Below, the same three screens are a tabbed tour: one
 * screen at a time, next to one plain paragraph; the tour advances on its
 * own every few seconds until the visitor touches it. The numbers section is
 * real North Carolina settlement data, and every claim is something the app
 * does today. No alert-email mockups, no illustrative filings, no
 * testimonials or logos until they are real. Motion is transform/opacity
 * only and switches off under prefers-reduced-motion
 * (features/landing/motion.ts). Signed-out visitors get no theme control.
 */
import { useEffect, useRef, useState, type CSSProperties, type JSX } from 'react';
import { Link } from 'react-router-dom';
import { Tabs } from '../../../ds/components/Tabs';
import { prefersReducedMotion, useRevealOnScroll, useScrollVar } from '../motion';
import './landing.css';

/** The three screens: on the desk (front to back) and in the tour (in order). Real screenshots against a sample book. */
const SCREENS = [
  {
    key: 'rates',
    src: '/landing/rate-changes.png',
    label: 'Rate changes',
    title: 'Every filing, matched to your book',
    body:
      'The Rate Bureau, your carriers, and the ones you compete with. Each filing is matched to your clients at the geography it names, statewide, county or rating territory, with the asked and approved numbers and the official source on every row.',
    alt: 'The Rate changes screen: every filing newest first, with who filed, the line, asked and approved percentages, where it applies, the effective date, and how many of the agency’s clients live there.',
  },
  {
    key: 'autopilot',
    src: '/landing/autopilot-queue.png',
    label: 'Autopilot',
    title: 'The email is already written',
    body:
      'When a filing touches your clients, Keepbook drafts one email per client with the real number in it, in your voice, and holds it for a day. Cancel any of them. The rest send from your agency, follow up once, and hand you a task when someone answers.',
    alt: 'The Autopilot queue: one drafted email per affected client, each held for a day with a cancel action, and the send date.',
  },
  {
    key: 'intake',
    src: '/landing/client-intake.png',
    label: 'Client intake',
    title: 'New clients fill in their own details',
    body:
      'Send a client one private link. They answer the questions a carrier will ask, upload their declarations page, and the answers land in your book. Nothing to retype.',
    alt: 'The client intake page a new client fills in from a private link: the questions a carrier asks, in plain sections, with a place to upload a declarations page.',
  },
] as const;

/** The fourth tour stop: real numbers instead of a screen. */
const NUMBERS_STOP = {
  key: 'numbers',
  label: 'The numbers',
  title: 'What got approved in North Carolina',
  body: 'Headlines report what a carrier asked for. Your clients pay what got approved. Keepbook shows both, with the dates.',
} as const;

const TOUR = [...SCREENS, NUMBERS_STOP] as const;
type StopKey = (typeof TOUR)[number]['key'];

/** How long each tour stop stays up before the next one, when nobody has touched the tabs. */
const TOUR_STEP_MS = 7000;

/** Real NC Rate Bureau homeowners, dwelling and auto filings (NCDOI settlements). */
const APPROVED = [
  { line: 'Homeowners', asked: '+42.2%', approved: '+7.5%', note: 'twice: Jun 2025 and Jun 2026' },
  { line: 'Dwelling fire', asked: '+68.3%', approved: '+5%', note: 'twice: Oct 2026 and Oct 2027' },
  { line: 'Private passenger auto', asked: '+22.6%', approved: '+5%', note: 'Oct 2025' },
];

function nextKey(current: StopKey): StopKey {
  const i = TOUR.findIndex((s) => s.key === current);
  return TOUR[(i + 1) % TOUR.length]?.key ?? TOUR[0].key;
}

export default function LandingPage(): JSX.Element {
  const root = useRef<HTMLDivElement | null>(null);
  const tour = useRef<HTMLElement | null>(null);
  useRevealOnScroll(root);
  useScrollVar(root);

  const [active, setActive] = useState<StopKey>('rates');
  // The tour runs itself until the visitor picks a tab (or prefers no motion),
  // pauses while the pointer is over it, and only while it is on screen.
  const [auto, setAuto] = useState(() => !prefersReducedMotion());
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  // The sticky "Request a demo" pill: shown once the hero's own buttons have
  // scrolled away, so the ask is one tap from anywhere on the page without
  // ever doubling the hero. `hidden` (not just CSS) keeps it out of the
  // accessibility tree while the hero button is on screen.
  const heroCta = useRef<HTMLDivElement | null>(null);
  const [heroCtaAway, setHeroCtaAway] = useState(false);

  useEffect(() => {
    const el = heroCta.current;
    if (el === null || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setHeroCtaAway(!(e?.isIntersecting ?? true)), {
      threshold: 0,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = tour.current;
    if (el === null || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setInView(e?.isIntersecting ?? false), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!auto || paused || !inView) return;
    const t = setTimeout(() => setActive((a) => nextKey(a)), TOUR_STEP_MS);
    return () => clearTimeout(t);
  }, [auto, paused, inView, active]);

  const current = TOUR.find((s) => s.key === active) ?? TOUR[0];
  const running = auto && inView && !paused;

  return (
    <div className="kb-land" ref={root}>
      <a href="#kb-land-main" className="kb-skip-link">
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
          <a href="/rates" className="kb-land__navlink">
            Rates
          </a>
          <Link to="/signup" className="kb-land__navlink kb-land__navlink--wide">
            Create your book
          </Link>
          <Link to="/login" className="kb-land__navlink">
            Log in
          </Link>
          <Link to="/demo" className="kb-btn kb-btn--primary kb-land__navcta">
            Request a demo
          </Link>
        </nav>
      </header>

      <main id="kb-land-main" className="kb-land__main">
        <section className="kb-land__hero" aria-labelledby="kb-land-title">
          <div className="kb-land__pitch">
            <p className="kb-land__eyebrow">For independent agencies in North Carolina</p>
            <h1 id="kb-land-title" className="kb-land__title">
              Their carrier just filed a rate&nbsp;hike.
              <em>You call them first.</em>
            </h1>
            <p className="kb-land__lede">
              Keepbook reads every public rate filing, finds which of your clients are about to
              feel it, and writes each of them an email in your voice. It holds the email a day
              for you, then sends, follows up, and hands you the task when they reply.
            </p>
            <div className="kb-land__cta" ref={heroCta}>
              <Link to="/demo" className="kb-btn kb-btn--primary kb-btn--lg">
                Request a demo
              </Link>
              <Link to="/signup" className="kb-btn kb-btn--secondary kb-btn--lg">
                Create your book
              </Link>
            </div>
            <p className="kb-land__proof">
              <span>Free in early access</span>
              <span>Flat price per agency, never per seat</span>
              <span>Import your book from a spreadsheet</span>
            </p>
          </div>

          <div className="kb-land__desk" aria-label="Three screens from Keepbook">
            {SCREENS.map((s, i) => (
              <figure className={`kb-land__screen kb-land__screen--${s.key}`} key={s.key} style={{ '--i': i } as CSSProperties}>
                <img
                  src={s.src}
                  alt={s.alt}
                  width={1400}
                  height={875}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                />
                <figcaption>{s.label}</figcaption>
              </figure>
            ))}
            {/* Three live pieces of the app, drifting over the desk. Decorative
                copies of real UI states (a filing row, a held email, intake
                progress), so screen readers skip them. */}
            <p className="kb-land__chip kb-land__chip--filing" aria-hidden="true">
              <span className="kb-land__chipdot" />
              NC Rate Bureau · Homeowners · <b>+7.5%</b> approved
            </p>
            <p className="kb-land__chip kb-land__chip--held" aria-hidden="true">
              Email held · sends tomorrow 9:00 <span className="kb-land__chipbtn">Cancel</span>
            </p>
            <p className="kb-land__chip kb-land__chip--intake" aria-hidden="true">
              Intake link opened · 3 of 9 sections saved
            </p>
          </div>
        </section>

        <section
          className="kb-land__how"
          aria-labelledby="kb-land-how"
          ref={tour}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <h2 id="kb-land-how" className="kb-land__h2 kb-land__h2--center" data-reveal>
            What it does
          </h2>
          <Tabs
            tabs={TOUR.map((s) => ({ id: s.key, label: s.label }))}
            active={active}
            onChange={(id) => {
              setActive(id as StopKey);
              setAuto(false);
            }}
            label="What Keepbook does"
            className="kb-land__tabs"
          >
            {running && <i className="kb-land__tabtimer" key={`timer-${active}`} aria-hidden="true" />}
            <article className="kb-land__panel" key={`stop-${current.key}`}>
              <div className="kb-land__blocktext">
                <h3 className="kb-land__h3">{current.title}</h3>
                <p>{current.body}</p>
                {current.key === 'numbers' && (
                  <p className="kb-land__blockfoot">
                    NC Rate Bureau filings, statewide averages, per NCDOI. Not anyone’s actual
                    premium. <a href="/rates">Every filing, newest first</a>
                  </p>
                )}
              </div>
              {current.key === 'numbers' ? (
                <ul className="kb-land__figures">
                  {APPROVED.map((r) => (
                    <li className="kb-land__figure" key={r.line}>
                      <p className="kb-land__figureline">{r.line}</p>
                      <p className="kb-land__figureasked">
                        asked <s>{r.asked}</s>
                      </p>
                      <p className="kb-land__figureapproved">{r.approved}</p>
                      <p className="kb-land__figurenote">{r.note}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <figure className="kb-land__blockshot">
                  <img src={current.src} alt={current.alt} width={1400} height={875} decoding="async" />
                </figure>
              )}
            </article>
          </Tabs>
        </section>

        <section className="kb-land__early" aria-labelledby="kb-land-early" data-reveal>
          <h2 id="kb-land-early" className="kb-land__h2">
            Free while it’s early
          </h2>
          <p className="kb-land__lede">
            Flat price per agency when it isn’t, never per seat. Your data stays yours: one database
            per agency, exportable to CSV in full, any time.
          </p>
          <div className="kb-land__cta kb-land__cta--center">
            <Link to="/demo" className="kb-btn kb-btn--primary kb-btn--lg">
              Request a demo
            </Link>
            <Link to="/signup" className="kb-btn kb-btn--secondary kb-btn--lg">
              Create your book
            </Link>
          </div>
        </section>
      </main>

      <Link to="/demo" className="kb-btn kb-btn--primary kb-land__sticky" hidden={!heroCtaAway}>
        Request a demo
      </Link>

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
