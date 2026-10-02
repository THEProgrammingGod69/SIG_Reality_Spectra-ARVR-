'use client';

import type Lenis from 'lenis';

/**
 * Page scroll lock for overlays (mobile menu, Modal).
 *
 * Lenis drives scrolling from wheel and touch events, so `overflow: hidden`
 * alone would not stop it — the lock also stops the running Lenis instance,
 * which `SmoothScroll` registers here. Locks are counted, so a Modal opened
 * from inside another overlay releases cleanly.
 */

let lenis: Lenis | null = null;
let locks = 0;

/** Called by `SmoothScroll` when Lenis starts (instance) and stops (null). */
export function registerLenis(instance: Lenis | null) {
  lenis = instance;
  if (instance && locks > 0) instance.stop();
}

/** Lock the page; returns the release function (safe to call more than once). */
export function lockScroll(): () => void {
  locks += 1;
  if (locks === 1) {
    lenis?.stop();
    document.documentElement.style.overflow = 'hidden';
  }

  let released = false;
  return () => {
    if (released) return;
    released = true;
    locks -= 1;
    if (locks === 0) {
      document.documentElement.style.overflow = '';
      lenis?.start();
    }
  };
}
