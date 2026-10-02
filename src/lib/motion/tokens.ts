/**
 * Motion tokens, read from CSS.
 *
 * `src/app/globals.css` is the only place a duration, easing or stagger value is
 * written. JavaScript (GSAP, Motion, the hero scene) reads the same CSS
 * variables at runtime through `readMotionTokens()`, so changing one token
 * changes CSS transitions and scripted animation together — and the
 * `prefers-reduced-motion` block that collapses the tokens to zero collapses
 * scripted motion too, with no extra code.
 *
 * The parsers are pure so they can be unit-tested without a browser.
 */

export const DURATION_TOKENS = ['micro', 'short', 'medium', 'long'] as const;
export type DurationToken = (typeof DURATION_TOKENS)[number];

export const EASE_TOKENS = {
  outExpo: '--ease-out-expo',
  inOut: '--ease-in-out',
} as const;
export type EaseToken = keyof typeof EASE_TOKENS;

/** Every CSS variable the motion system reads. A unit test checks each exists. */
export const MOTION_TOKEN_VARS = [
  ...DURATION_TOKENS.map((name) => `--dur-${name}` as const),
  ...Object.values(EASE_TOKENS),
  '--stagger',
  '--motion-rise',
] as const;

/** A cubic-bezier curve as four control-point numbers. */
export type Bezier = readonly [number, number, number, number];

const LINEAR: Bezier = [0, 0, 1, 1];

export type MotionTokens = {
  /** Durations in seconds (GSAP's unit; Motion accepts seconds too). */
  readonly dur: Readonly<Record<DurationToken, number>>;
  readonly ease: Readonly<Record<EaseToken, Bezier>>;
  /** Delay between siblings, in seconds. */
  readonly stagger: number;
  /** Entrance travel distance, in CSS pixels. */
  readonly rise: number;
};

/**
 * `'150ms'` → 0.15, `'1.2s'` → 1.2. Anything unparseable is 0, so a missing
 * token degrades to "no animation" rather than to a random default.
 */
export function parseDuration(value: string): number {
  const match = /^\s*(-?\d*\.?\d+)\s*(ms|s)\s*$/i.exec(value);
  if (!match) return 0;

  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount < 0) return 0;

  return match[2]?.toLowerCase() === 'ms' ? amount / 1000 : amount;
}

/** `'cubic-bezier(0.16, 1, 0.3, 1)'` → `[0.16, 1, 0.3, 1]`; otherwise `null`. */
export function parseCubicBezier(value: string): Bezier | null {
  const match = /^\s*cubic-bezier\(\s*([^)]*)\)\s*$/i.exec(value);
  if (!match?.[1]) return null;

  const parts = match[1].split(',').map((part) => Number(part.trim()));
  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) return null;

  const [x1, y1, x2, y2] = parts as [number, number, number, number];
  // The x coordinates of a CSS cubic-bezier must lie in [0, 1].
  if (x1 < 0 || x1 > 1 || x2 < 0 || x2 > 1) return null;

  return [x1, y1, x2, y2];
}

/** `'1.5rem'` → 24 (at a 16px root), `'24px'` → 24; otherwise 0. */
export function parseLength(value: string, rootFontSizePx = 16): number {
  const match = /^\s*(-?\d*\.?\d+)\s*(px|rem)\s*$/i.exec(value);
  if (!match) return 0;

  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return 0;

  return match[2]?.toLowerCase() === 'rem' ? amount * rootFontSizePx : amount;
}

/** Build the token object from a variable lookup. Exported for tests. */
export function motionTokensFrom(read: (cssVar: string) => string, rootFontSizePx = 16) {
  const dur = Object.fromEntries(
    DURATION_TOKENS.map((name) => [name, parseDuration(read(`--dur-${name}`))]),
  ) as Record<DurationToken, number>;

  const ease = Object.fromEntries(
    Object.entries(EASE_TOKENS).map(([name, cssVar]) => [
      name,
      parseCubicBezier(read(cssVar)) ?? LINEAR,
    ]),
  ) as Record<EaseToken, Bezier>;

  return {
    dur,
    ease,
    stagger: parseDuration(read('--stagger')),
    rise: parseLength(read('--motion-rise'), rootFontSizePx),
  } satisfies MotionTokens;
}

/**
 * Read the live motion tokens from the document. Client-only.
 *
 * Call it when an animation starts rather than once at module load: the
 * values change when the visitor toggles "reduce motion".
 */
export function readMotionTokens(root: HTMLElement = document.documentElement): MotionTokens {
  const style = getComputedStyle(root);
  const rootFontSizePx = parseFloat(style.fontSize) || 16;

  return motionTokensFrom((cssVar) => style.getPropertyValue(cssVar), rootFontSizePx);
}

/** Read any CSS custom property (e.g. a colour token) from the document. Client-only. */
export function readCssVar(cssVar: string, root: HTMLElement = document.documentElement): string {
  return getComputedStyle(root).getPropertyValue(cssVar).trim();
}
