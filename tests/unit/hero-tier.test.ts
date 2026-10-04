import { describe, expect, it } from 'vitest';

import {
  HERO_TIER_BUDGET,
  isSoftwareRenderer,
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

  it('serves the static still when WebGL would be drawn by the CPU (D-033)', () => {
    expect(selectHeroTier({ ...desktop, softwareRendering: true })).toEqual({
      tier: 'static',
      reason: 'software WebGL (no GPU)',
    });
    expect(selectHeroTier({ ...desktop, softwareRendering: false }).tier).toBe('high');
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

describe('isSoftwareRenderer (D-034)', () => {
  it.each([
    'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)',
    'Google SwiftShader',
    'llvmpipe (LLVM 15.0.7, 256 bits)',
    'Microsoft Basic Render Driver',
  ])('recognises a CPU renderer: %s', (renderer) => {
    expect(isSoftwareRenderer(renderer)).toBe(true);
  });

  it.each([
    'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'Apple GPU',
    'Adreno (TM) 650',
    'Mali-G57 MC2',
  ])('leaves a real GPU alone: %s', (renderer) => {
    expect(isSoftwareRenderer(renderer)).toBe(false);
  });

  it('cannot tell without a name, so does not assume software', () => {
    expect(isSoftwareRenderer(null)).toBe(false);
  });
});
