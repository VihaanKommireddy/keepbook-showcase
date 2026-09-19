/**
 * The landing page's two motion primitives. Both are opt-in per element and
 * both switch off completely under prefers-reduced-motion (and in any
 * environment without the browser APIs, such as jsdom in tests):
 *
 *  - useRevealOnScroll: every descendant of `root` carrying `data-reveal`
 *    gets the class `is-in` once it enters the viewport. CSS does the rest
 *    (opacity + translate, transform-only so nothing reflows).
 *  - useScrollVar: writes the page's scroll offset (capped) into a CSS custom
 *    property on `root`, throttled to one write per frame. CSS multiplies it
 *    into small translates for the hero's stack of screens — the only
 *    parallax on the page.
 */
import { useEffect, type RefObject } from 'react';

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useRevealOnScroll(root: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const el = root.current;
    if (el === null) return;
    const targets = Array.from(el.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (targets.length === 0) return;
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      for (const t of targets) t.classList.add('is-in');
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.18, rootMargin: '0px 0px -8% 0px' },
    );
    for (const t of targets) io.observe(t);
    return () => io.disconnect();
  }, [root]);
}

export function useScrollVar(root: RefObject<HTMLElement | null>, name = '--kb-scroll', cap = 720): void {
  useEffect(() => {
    const el = root.current;
    if (el === null || prefersReducedMotion()) return;
    let frame = 0;
    const write = (): void => {
      frame = 0;
      el.style.setProperty(name, String(Math.min(window.scrollY, cap)));
    };
    const onScroll = (): void => {
      if (frame === 0) frame = window.requestAnimationFrame(write);
    };
    write();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame !== 0) window.cancelAnimationFrame(frame);
      el.style.removeProperty(name);
    };
  }, [root, name, cap]);
}
