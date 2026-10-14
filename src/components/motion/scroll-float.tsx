'use client';

import { useLayoutEffect, useRef } from 'react';

import { cn } from '@/lib/cn';
import { gsap } from '@/lib/motion/gsap';
import { reachablePoint } from '@/lib/motion/scroll-point';

import { prefersReducedMotion, useReducedMotion } from './use-reduced-motion';

/**
 * The start pose, from React Bits: a character below its place, stretched
 * tall and narrow. Shapes, not distances — they scale with the type.
 */
const FROM = { opacity: 0, yPercent: 110, scaleY: 2.2, scaleX: 0.7, transformOrigin: '50% 0%' };
/**
 * Each character starts this share of a character's run after the one before
 * it. The run is scrubbed, so this is a proportion of the scroll, not a time.
 */
const CHAR_LAG = 0.08;

type ScrollFloatProps = {
  text: string;
  /** Classes for the line (size, alignment). */
  className?: string;
  /** Classes for every character — the fill, when it is a gradient clipped to the text. */
  charClassName?: string;
};

/**
 * ScrollFloat — our version of React Bits' ScrollFloat (D-038), for one line
 * of display type: its characters float up into place from below, stretched
 * tall and narrow like light refracting through a lens, and settle as the
 * reader brings the line up the screen. Scrubbed, so it moves only while the
 * page does; the run ends when the line's bottom is 60% down the screen — or
 * at the end of the page, whichever the reader can reach first.
 *
 * `transform` and `opacity` only (rule 4). Decorative by design: give it
 * `aria-hidden` (the footer's wordmark repeats the name the badge carries).
 * Reduced motion: the line is simply there.
 */
export function ScrollFloat({ text, className, charClassName }: ScrollFloatProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reducedMotion = useReducedMotion();

  useLayoutEffect(() => {
    const line = ref.current;
    if (!line || reducedMotion || prefersReducedMotion()) return;

    const chars = line.querySelectorAll('[data-char]');
    const context = gsap.context(() => {
      gsap.fromTo(chars, FROM, {
        opacity: 1,
        yPercent: 0,
        scaleY: 1,
        scaleX: 1,
        ease: 'none',
        stagger: CHAR_LAG,
        scrollTrigger: {
          trigger: line,
          start: reachablePoint(line, 'top', 1),
          end: reachablePoint(line, 'bottom', 0.6),
          scrub: true,
        },
      });
    }, line);

    return () => context.revert();
  }, [reducedMotion]);

  return (
    <p ref={ref} className={className}>
      {Array.from(text).map((char, index) => (
        <span key={index} data-char className={cn('inline-block whitespace-pre', charClassName)}>
          {char}
        </span>
      ))}
    </p>
  );
}
