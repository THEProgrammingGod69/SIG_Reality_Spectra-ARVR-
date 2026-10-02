'use client';

import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { useEffect } from 'react';

import { gsap, ScrollTrigger } from '@/lib/motion/gsap';

import { registerLenis } from './scroll-lock';
import { prefersReducedMotion, useReducedMotion } from './use-reduced-motion';

/** GSAP's default lag smoothing, restored when Lenis stops. */
const GSAP_LAG_THRESHOLD_MS = 500;
const GSAP_LAG_ADJUSTED_MS = 33;

/**
 * Lenis smooth scrolling, driven by GSAP's ticker.
 *
 * One requestAnimationFrame loop runs everything: GSAP ticks, Lenis advances
 * the scroll inside that tick, and every Lenis scroll updates ScrollTrigger, so
 * pinned and scrubbed animations never lag a frame behind the page.
 *
 * Off under `prefers-reduced-motion` (native scrolling, no easing), and torn
 * down the moment the visitor switches that setting on. Renders nothing.
 */
export function SmoothScroll() {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion || prefersReducedMotion()) return;

    // In-page anchors stay native so the skip link still moves keyboard focus.
    const lenis = new Lenis({ autoRaf: false });
    const offScroll = lenis.on('scroll', ScrollTrigger.update);

    const tick = (seconds: number) => lenis.raf(seconds * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    // Overlays stop and restart this instance through the scroll lock.
    registerLenis(lenis);

    return () => {
      registerLenis(null);
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(GSAP_LAG_THRESHOLD_MS, GSAP_LAG_ADJUSTED_MS);
      offScroll();
      lenis.destroy();
    };
  }, [reducedMotion]);

  return null;
}
