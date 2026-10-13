'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';

import { cn } from '@/lib/cn';
import { gsap } from '@/lib/motion/gsap';
import { reachablePoint } from '@/lib/motion/scroll-point';

import { prefersReducedMotion, useReducedMotion } from './use-reduced-motion';

/**
 * Room around each separator. Each item carries its own trailing space (gap
 * plus end padding), so the copies line up exactly with one another.
 */
const spacings = {
  md: 'gap-x-6 pe-6',
  lg: 'gap-x-10 pe-10',
} as const;

/**
 * How far the track travels while the band crosses the viewport, as a share
 * of the track (two copies). Each copy is at least as wide as the band, so a
 * quarter of the track never runs past the end of the second copy.
 */
const TRAVEL_PERCENT = 25;

type MarqueeProps = {
  /** What slides past, in order; drawn twice so the band never runs dry. */
  items: readonly ReactNode[];
  /** Slide left to right as the page scrolls down (default: right to left). */
  reverse?: boolean;
  /** Drawn after every item, the last included. */
  separator?: ReactNode;
  spacing?: keyof typeof spacings;
  /**
   * The fewest items one copy holds: a short list is repeated within each
   * copy until it reaches this, so the band is always full.
   */
  minItems?: number;
  className?: string;
};

/**
 * Marquee — our version of React Bits' ScrollVelocity (D-037): a band of type
 * that slides sideways as the reader scrolls past it, tied to the scroll
 * position (`xPercent`, a `transform`), never to a clock. Nothing moves on
 * its own, so there is no endless motion to pause (WCAG 2.2.2) and nothing
 * runs while the page is still.
 *
 * Without JavaScript and under reduced motion the band is a still line of
 * type. Each copy is at least a screen wide (short lists repeat, `minItems`),
 * so the band is full at any width and any point of its travel. The edges
 * fade with a static mask.
 *
 * Decorative only: the whole band is `aria-hidden`, so use it for text that
 * the page also states properly elsewhere (the Home domain ticker repeats the
 * domain list beneath it).
 */
export function Marquee({
  items,
  reverse = false,
  separator,
  spacing = 'lg',
  minItems = 6,
  className,
}: MarqueeProps) {
  const bandRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useLayoutEffect(() => {
    const band = bandRef.current;
    const track = trackRef.current;
    if (!band || !track || reducedMotion || prefersReducedMotion()) return;

    const [from, to] = reverse ? [-TRAVEL_PERCENT, 0] : [0, -TRAVEL_PERCENT];
    const context = gsap.context(() => {
      gsap.fromTo(
        track,
        { xPercent: from },
        {
          xPercent: to,
          ease: 'none',
          scrollTrigger: {
            trigger: band,
            // From the moment the band enters at the bottom until it leaves at the top.
            start: reachablePoint(band, 'top', 1),
            end: reachablePoint(band, 'bottom', 0),
            scrub: true,
          },
        },
      );
    }, band);
    return () => context.revert();
  }, [reverse, reducedMotion]);

  const repeats = items.length > 0 ? Math.ceil(minItems / items.length) : 0;
  const run = Array.from({ length: repeats }, () => items).flat();

  const copy = (key: string) => (
    <div key={key} className="flex min-w-screen shrink-0 items-center justify-around">
      {run.map((item, index) => (
        <div key={index} className={cn('flex shrink-0 items-center', spacings[spacing])}>
          {item}
          {separator}
        </div>
      ))}
    </div>
  );

  return (
    <div
      ref={bandRef}
      aria-hidden="true"
      className={cn('flex overflow-hidden mask-x-from-85% mask-x-to-100% select-none', className)}
    >
      <div ref={trackRef} className="flex w-max shrink-0">
        {copy('a')}
        {copy('b')}
      </div>
    </div>
  );
}
