'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

import { ScrollTrigger } from '@/lib/motion/gsap';

/** How long the page's height must hold still before triggers are re-measured. */
const SETTLE_MS = 150;

/**
 * Keeps every ScrollTrigger's measurements current (D-037). Renders nothing.
 *
 * ScrollTrigger measures where each trigger starts once, and again only on a
 * window resize or load. Two things move content without either: a client
 * navigation (the layout's footer keeps its triggers while the page above it
 * changes length) and sections that stream in after the shell (Suspense).
 * A trigger measured against the old layout can start past the new page's
 * end and leave its element hidden for good. So: re-measure after every route
 * change, and whenever the document's height settles at a new value.
 */
export function ScrollRefresh() {
  const pathname = usePathname();
  const firstRoute = useRef(true);

  useEffect(() => {
    // The first page is measured by ScrollTrigger itself on load.
    if (firstRoute.current) {
      firstRoute.current = false;
      return;
    }
    ScrollTrigger.refresh();
  }, [pathname]);

  useEffect(() => {
    let timer = 0;
    let measured = document.documentElement.scrollHeight;
    const observer = new ResizeObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const height = document.documentElement.scrollHeight;
        // Only a real change: a refresh that lands on the same height (pin
        // spacing re-applied as it was) must not start another.
        if (height === measured) return;
        measured = height;
        ScrollTrigger.refresh();
      }, SETTLE_MS);
    });
    observer.observe(document.body);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  return null;
}
