'use client';

import { useSyncExternalStore } from 'react';

import { readMotionTokens, type MotionTokens } from '@/lib/motion/tokens';

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

let snapshot: MotionTokens | null = null;

function subscribe(onChange: () => void) {
  // The tokens collapse to zero under "reduce motion", so re-read on change.
  const media = window.matchMedia(REDUCED_MOTION);
  const handle = () => {
    snapshot = null;
    onChange();
  };
  media.addEventListener('change', handle);
  return () => media.removeEventListener('change', handle);
}

function getSnapshot(): MotionTokens {
  snapshot ??= readMotionTokens();
  return snapshot;
}

/**
 * The live motion tokens for render-time use (e.g. Motion `transition` props).
 * `null` during server rendering and hydration — treat that as "no animation".
 * Effects and event handlers can call `readMotionTokens()` directly instead.
 */
export function useMotionTokens(): MotionTokens | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
