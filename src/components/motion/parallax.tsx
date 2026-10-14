'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';

import { cn } from '@/lib/cn';
import { gsap } from '@/lib/motion/gsap';
import { reachablePoint } from '@/lib/motion/scroll-point';
import { parseLength, readCssVar } from '@/lib/motion/tokens';

import { prefersReducedMotion, useReducedMotion } from './use-reduced-motion';

type ParallaxProps = {
  children?: ReactNode;
  className?: string;
  /**
   * Vertical drift across the element's passage through the viewport, in
   * `--motion-depth` units: it starts this far below its place and ends this
   * far above. Negative drifts the other way.
   */
  depth?: number;
  /** Turn across the passage, in `--motion-turn` units. */
  turn?: number;
  /**
   * Open like a portal: scale from 1 to `--motion-portal` between the element
   * entering the viewport and its centre reaching the viewport's centre.
   */
  portal?: boolean;
};

/**
 * Parallax (D-038): a decorative layer that moves with the reader's scroll —
 * a drift, a turn, or a portal opening — so the lab has depth as the page
 * passes. Scrubbed by ScrollTrigger: it moves only while the page does
 * (nothing on its own, WCAG 2.2.2), between trigger points the page can reach.
 *
 * `transform` only (rule 4), and only on decoration: wrap backdrops, never
 * content. Distances are tokens (`--motion-depth`, `--motion-turn`,
 * `--motion-portal`), multiplied by the props. Reduced motion: it stays put.
 * Cleanup reverts exactly its own tween and trigger.
 */
export function Parallax({
  children,
  className,
  depth = 0,
  turn = 0,
  portal = false,
}: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || reducedMotion || prefersReducedMotion()) return;
    if (depth === 0 && turn === 0 && !portal) return;

    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const travel = depth * parseLength(readCssVar('--motion-depth'), rootFontSize);
    const degrees = turn * (parseFloat(readCssVar('--motion-turn')) || 0);
    const opened = parseFloat(readCssVar('--motion-portal')) || 1;

    const from: gsap.TweenVars = {};
    const to: gsap.TweenVars = { ease: 'none' };
    if (travel) {
      from.y = travel;
      to.y = -travel;
    }
    if (degrees) {
      from.rotate = 0;
      to.rotate = degrees;
    }
    if (portal) {
      from.scale = 1;
      to.scale = opened;
    }

    const context = gsap.context(() => {
      gsap.fromTo(element, from, {
        ...to,
        scrollTrigger: {
          trigger: element,
          start: reachablePoint(element, 'top', 1),
          end: portal
            ? reachablePoint(element, 'center', 0.5)
            : reachablePoint(element, 'bottom', 0),
          scrub: true,
        },
      });
    }, element);

    return () => context.revert();
  }, [depth, turn, portal, reducedMotion]);

  return (
    <div ref={ref} className={cn('size-full', className)}>
      {children}
    </div>
  );
}
