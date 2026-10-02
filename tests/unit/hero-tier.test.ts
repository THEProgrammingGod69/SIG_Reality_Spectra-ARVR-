import { describe, expect, it } from 'vitest';

import {
  HERO_TIER_BUDGET,
  LOW_TIER_LIMITS,
  parseHeroTierOverride,
  selectHeroTier,
  type HeroTierSignals,
} from '@/lib/motion/hero-tier';

/** A capable desktop: every signal comfortably above the low-tier limits. */
const desktop: HeroTierSignals = {
  reducedMotion: false,
  webgl: true,
  viewportWidth: 1440,
  hardwareConcurrency: 8,
  deviceMemory: 8,
  saveData: false,
};

describe('selectHeroTier', () => {
  it('gives a capable desktop the full scene', () => {
    expect(selectHeroTier(desktop).tier).toBe('high');
  });

  it('serves the static still under prefers-reduced-motion, whatever the device', () => {
    expect(selectHeroTier({ ...desktop, reducedMotion: true })).toEqual({
      tier: 'static',
      reason: 'prefers-reduced-motion',
    });
  });

  it('serves the static still without WebGL 2', () => {
    expect(selectHeroTier({ ...desktop, webgl: false }).tier).toBe('static');
  });

  it('lets reduced motion win over every other signal', () => {
    const weakPhone: HeroTierSignals = {
      reducedMotion: true,
      webgl: false,
      viewportWidth: 360,
      hardwareConcurrency: 2,
      deviceMemory: 1,
      saveData: true,
    };
    expect(selectHeroTier(weakPhone).reason).toBe('prefers-reduced-motion');
  });

  it.each([
    ['a phone-width viewport', { viewportWidth: 390 }],
    ['the widest low-tier viewport', { viewportWidth: LOW_TIER_LIMITS.maxViewportWidth }],
    ['four CPU cores', { hardwareConcurrency: 4 }],
    ['4 GB of memory', { deviceMemory: 4 }],
    ['data saver', { saveData: true }],
  ])('drops to the low tier for %s', (_label, override) => {
    expect(selectHeroTier({ ...desktop, ...override }).tier).toBe('low');
  });

  it('keeps the high tier at the md breakpoint (768px)', () => {
    expect(selectHeroTier({ ...desktop, viewportWidth: 768 }).tier).toBe('high');
  });

  it('does not penalise browsers that hide hardware hints', () => {
    // Safari and Firefox expose neither deviceMemory nor, sometimes, core counts.
    expect(
      selectHeroTier({ ...desktop, hardwareConcurrency: undefined, deviceMemory: undefined }).tier,
    ).toBe('high');
  });

  it('always explains its decision', () => {
    for (const signals of [
      desktop,
      { ...desktop, viewportWidth: 390 },
      { ...desktop, webgl: false },
    ]) {
      expect(selectHeroTier(signals).reason.length).toBeGreaterThan(0);
    }
  });
});

describe('HERO_TIER_BUDGET', () => {
  it('gives the low tier half the particles and stars, and no pointer tilt', () => {
    expect(HERO_TIER_BUDGET.low.particles).toBe(HERO_TIER_BUDGET.high.particles / 2);
    expect(HERO_TIER_BUDGET.low.stars).toBe(HERO_TIER_BUDGET.high.stars / 2);
    expect(HERO_TIER_BUDGET.low.pointerTilt).toBe(false);
    expect(HERO_TIER_BUDGET.high.pointerTilt).toBe(true);
  });

  it('caps the pixel ratio at 2 on every tier', () => {
    expect(HERO_TIER_BUDGET.high.maxDpr).toBeLessThanOrEqual(2);
    expect(HERO_TIER_BUDGET.low.maxDpr).toBeLessThanOrEqual(HERO_TIER_BUDGET.high.maxDpr);
  });
});

describe('parseHeroTierOverride', () => {
  it('reads a valid ?hero-tier value', () => {
    expect(parseHeroTierOverride('?hero-tier=low')).toBe('low');
    expect(parseHeroTierOverride('?a=1&hero-tier=static')).toBe('static');
  });

  it('ignores anything else', () => {
    expect(parseHeroTierOverride('')).toBeNull();
    expect(parseHeroTierOverride('?hero-tier=ultra')).toBeNull();
    expect(parseHeroTierOverride('?tier=high')).toBeNull();
  });
});
