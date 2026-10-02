'use client';

import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

/**
 * The visitor's live "reduce motion" preference, read synchronously.
 *
 * Effects should check this as well as the hook value: during hydration the
 * hook reports the server value (`false`) for one render.
 */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(QUERY).matches;
}

/**
 * `true` when the visitor asked the operating system to reduce motion.
 * Re-renders when the setting changes, so an animation can tear itself down
 * the moment the visitor switches it on.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false);
}
