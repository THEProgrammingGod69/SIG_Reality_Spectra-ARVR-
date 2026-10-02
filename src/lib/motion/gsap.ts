import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { type Bezier, type EaseToken, type MotionTokens } from './tokens';

/**
 * The one place GSAP plugins are registered.
 *
 * Client components import `gsap` and `ScrollTrigger` from here rather than
 * from the package, so registration happens exactly once and never on the
 * server (where there is no window to register against).
 */

let registered = false;

function register() {
  if (registered || typeof window === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger, CustomEase);
  registered = true;
}

register();

const easeCache = new Map<string, gsap.EaseFunction>();

/**
 * A GSAP ease function for a motion-token curve.
 *
 * GSAP has no native `cubic-bezier()`, so the token's control points become a
 * CustomEase, cached by curve so repeated tweens share one function.
 */
export function gsapEase(tokens: MotionTokens, name: EaseToken): gsap.EaseFunction {
  return easeFor(tokens.ease[name]);
}

function easeFor(bezier: Bezier): gsap.EaseFunction {
  const key = bezier.join(',');
  const cached = easeCache.get(key);
  if (cached) return cached;

  register();
  const ease = CustomEase.create(`sig-ease-${easeCache.size}`, key);
  easeCache.set(key, ease);
  return ease;
}

export { gsap, ScrollTrigger };
