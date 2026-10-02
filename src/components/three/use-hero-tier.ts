'use client';

import { useSyncExternalStore } from 'react';

import {
  parseHeroTierOverride,
  readHeroTierSignals,
  selectHeroTier,
  type HeroTierDecision,
} from '@/lib/motion/hero-tier';

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

let cached: HeroTierDecision | null = null;

function decide(): HeroTierDecision {
  // `?hero-tier=low|high|static` forces a tier in development (playground links).
  if (process.env.NODE_ENV !== 'production') {
    const override = parseHeroTierOverride(window.location.search);
    if (override) return { tier: override, reason: `override ?hero-tier=${override}` };
  }
  return selectHeroTier(readHeroTierSignals());
}

function getSnapshot(): HeroTierDecision {
  cached ??= decide();
  return cached;
}

function subscribe(onChange: () => void) {
  // The tier is decided once per page; only "reduce motion" can change it live.
  // Resizing never swaps tiers, which would tear down and rebuild the canvas.
  const media = window.matchMedia(REDUCED_MOTION);
  const handle = () => {
    cached = null;
    onChange();
  };
  media.addEventListener('change', handle);
  return () => media.removeEventListener('change', handle);
}

/**
 * The hero's device tier, or `null` during server rendering and hydration.
 * `null` renders exactly like the static tier, so the server HTML and the
 * first client render always agree.
 */
export function useHeroTier(): HeroTierDecision | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
