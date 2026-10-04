'use client';

import { useEffect, useState, type ReactNode } from 'react';

/** Becomes true after the first page has hydrated; later pages are navigations. */
const session = { hydrated: false };

/**
 * Route change fade, rendered by `(site)/template.tsx` (a template remounts on
 * every navigation, a layout does not).
 *
 * Opacity only — no transform on this wrapper, because a transformed ancestor
 * would break the hero's pinned (position: fixed) scroll-out. The first page
 * load never fades: the hero name must be visible at first paint (D-010), so
 * only client-side navigations animate. It is the `animate-fade-in` keyframe
 * token, plain CSS, so no animation library loads for it (D-033); under
 * reduced motion its duration token is zero.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  // Decided once per mount; false during hydration so server and client agree.
  const [animate] = useState(() => typeof window !== 'undefined' && session.hydrated);

  useEffect(() => {
    session.hydrated = true;
  }, []);

  return <div className={animate ? 'animate-fade-in' : undefined}>{children}</div>;
}
