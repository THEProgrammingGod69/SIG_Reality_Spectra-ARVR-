/**
 * Device tiers for the 3D hero (docs/ARCHITECTURE.md, Technical Plan fig. 9).
 *
 *   static — reduced motion or no WebGL 2: the designed still, no canvas, no 3D JS
 *   low    — a weaker device: half the particles, no pointer tilt, lower DPR
 *   high   — the full scene
 *
 * `selectHeroTier` is pure so the decision is unit-tested; `readHeroTierSignals`
 * gathers the inputs in the browser.
 */

export const HERO_TIERS = ['static', 'low', 'high'] as const;
export type HeroTier = (typeof HERO_TIERS)[number];

export type HeroTierSignals = {
  readonly reducedMotion: boolean;
  /** WebGL 2 is available (three.js r163+ requires it). */
  readonly webgl: boolean;
  readonly viewportWidth: number;
  /** `navigator.hardwareConcurrency`; absent in some browsers. */
  readonly hardwareConcurrency?: number | undefined;
  /** `navigator.deviceMemory` in GB; Chromium only. */
  readonly deviceMemory?: number | undefined;
  /** The visitor asked for reduced data (`navigator.connection.saveData`). */
  readonly saveData?: boolean | undefined;
};

/** At or below any of these, the device gets the low tier. */
export const LOW_TIER_LIMITS = {
  maxCores: 4,
  maxMemoryGb: 4,
  /** Phones and small tablets: below the `md` breakpoint (768px). */
  maxViewportWidth: 767,
} as const;

export type HeroTierDecision = { readonly tier: HeroTier; readonly reason: string };

export function selectHeroTier(signals: HeroTierSignals): HeroTierDecision {
  if (signals.reducedMotion) return { tier: 'static', reason: 'prefers-reduced-motion' };
  if (!signals.webgl) return { tier: 'static', reason: 'no WebGL 2' };

  if (signals.saveData) return { tier: 'low', reason: 'data saver on' };
  if (signals.viewportWidth <= LOW_TIER_LIMITS.maxViewportWidth) {
    return { tier: 'low', reason: 'small viewport' };
  }
  if (
    signals.hardwareConcurrency !== undefined &&
    signals.hardwareConcurrency <= LOW_TIER_LIMITS.maxCores
  ) {
    return { tier: 'low', reason: `${signals.hardwareConcurrency} CPU cores` };
  }
  if (signals.deviceMemory !== undefined && signals.deviceMemory <= LOW_TIER_LIMITS.maxMemoryGb) {
    return { tier: 'low', reason: `${signals.deviceMemory} GB memory` };
  }

  return { tier: 'high', reason: 'capable device' };
}

/** What each 3D tier renders. The static tier renders no canvas at all. */
export const HERO_TIER_BUDGET = {
  high: { particles: 900, stars: 1200, pointerTilt: true, maxDpr: 2, antialias: true },
  low: { particles: 450, stars: 600, pointerTilt: false, maxDpr: 1.5, antialias: false },
} as const satisfies Record<Exclude<HeroTier, 'static'>, unknown>;

/**
 * Development override: `/?hero-tier=low`. The caller only honours it outside
 * production, so visitors can never be forced into a tier by a link.
 */
export function parseHeroTierOverride(search: string): HeroTier | null {
  const value = new URLSearchParams(search).get('hero-tier');
  return HERO_TIERS.find((tier) => tier === value) ?? null;
}

/** WebGL 2 support, without keeping the probe context alive. Client-only. */
export function detectWebGL2(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return false;
    // Release the probe immediately so it never counts against the context budget.
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

type NavigatorWithHints = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
};

/** Collect the tier inputs from the current browser. Client-only. */
export function readHeroTierSignals(): HeroTierSignals {
  const nav = navigator as NavigatorWithHints;

  return {
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    webgl: detectWebGL2(),
    viewportWidth: window.innerWidth,
    hardwareConcurrency: nav.hardwareConcurrency || undefined,
    deviceMemory: nav.deviceMemory,
    saveData: nav.connection?.saveData,
  };
}
