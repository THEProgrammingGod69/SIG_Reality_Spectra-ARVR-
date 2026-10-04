/**
 * Device tiers for the 3D hero (docs/ARCHITECTURE.md, Technical Plan fig. 9).
 *
 *   static — reduced motion, no WebGL 2, or WebGL drawn in software (no GPU):
 *            the designed still, no canvas, no 3D JS
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
  /**
   * WebGL would be drawn by the CPU (no GPU acceleration: SwiftShader, llvmpipe,
   * a blocked driver). Every frame of the scene would then cost main-thread time.
   */
  readonly softwareRendering?: boolean | undefined;
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
  if (signals.softwareRendering) return { tier: 'static', reason: 'software WebGL (no GPU)' };

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

/**
 * Renderers that draw WebGL on the CPU: Chrome's SwiftShader (also behind
 * ANGLE, as headless Chrome uses), Mesa's llvmpipe/softpipe, and Windows'
 * fallback driver. Pure, so it is unit-tested.
 */
export function isSoftwareRenderer(renderer: string | null): boolean {
  return renderer !== null && /swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer);
}

type WebGLProbe = { available: boolean; renderer: string | null };

/**
 * Make a WebGL 2 context, read what draws it, and release it at once so the
 * probe never counts against the context budget. Client-only.
 */
function probeWebGL2(options?: WebGLContextAttributes): WebGLProbe {
  try {
    const gl = document.createElement('canvas').getContext('webgl2', options);
    if (!gl) return { available: false, renderer: null };
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : null;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return { available: true, renderer };
  } catch {
    return { available: false, renderer: null };
  }
}

/** WebGL 2 support. Client-only. */
export function detectWebGL2(): boolean {
  return probeWebGL2().available;
}

type NavigatorWithHints = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
};

/** Collect the tier inputs from the current browser. Client-only. */
export function readHeroTierSignals(): HeroTierSignals {
  const nav = navigator as NavigatorWithHints;

  const probe = probeWebGL2();
  return {
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    webgl: probe.available,
    // Software if the renderer says so, or if the browser refuses a context
    // that must not carry a major performance caveat.
    softwareRendering:
      probe.available &&
      (isSoftwareRenderer(probe.renderer) ||
        !probeWebGL2({ failIfMajorPerformanceCaveat: true }).available),
    viewportWidth: window.innerWidth,
    hardwareConcurrency: nav.hardwareConcurrency || undefined,
    deviceMemory: nav.deviceMemory,
    saveData: nav.connection?.saveData,
  };
}
