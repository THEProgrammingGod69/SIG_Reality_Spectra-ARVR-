'use client';

import { Fragment, useLayoutEffect, useRef } from 'react';

import { gsap } from '@/lib/motion/gsap';
import { reachablePoint } from '@/lib/motion/scroll-point';
import { readCssVar } from '@/lib/motion/tokens';

import { prefersReducedMotion, useReducedMotion } from './use-reduced-motion';

type ScrollWordsProps = {
  text: string;
  className?: string;
};

/**
 * The reading band: the first word starts to brighten as the paragraph's top
 * reaches 85% down the viewport, the last is lit by the time its bottom
 * reaches 55% — or by the end of the page, if that comes first.
 */
const SCRUB_START_AT = 0.85;
const SCRUB_END_AT = 0.55;

/**
 * ScrollWords — our version of React Bits' ScrollReveal (D-037).
 *
 * A statement paragraph whose words brighten one after another as the reader
 * scrolls through it, tied to the scroll position rather than to a clock.
 * ScrollReveal also blurred the words (`filter`) and its cleanup killed every
 * ScrollTrigger on the page; this animates `opacity` alone (rule 4) and
 * reverts only its own tween.
 *
 * Nothing is dimmed ahead of time: without JavaScript, under reduced motion,
 * or when the paragraph is already on screen at load, every word is at full
 * strength. The dimmed start (`--motion-dim`) is set only while the paragraph
 * is still below the fold.
 */
export function ScrollWords({ text, className }: ScrollWordsProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reducedMotion = useReducedMotion();
  const words = text.split(/\s+/).filter(Boolean);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || reducedMotion || prefersReducedMotion()) return;
    if (element.getBoundingClientRect().top < window.innerHeight) return;

    const dim = parseFloat(readCssVar('--motion-dim'));
    const context = gsap.context(() => {
      gsap.fromTo(
        element.querySelectorAll('[data-word]'),
        { opacity: Number.isFinite(dim) ? dim : 1 },
        {
          opacity: 1,
          // Scrubbed: these are shares of the scroll distance, not seconds.
          // Each word takes three steps to brighten and starts one step after
          // the last, so a few words are always mid-way, like a reading eye.
          duration: 3,
          stagger: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: element,
            start: reachablePoint(element, 'top', SCRUB_START_AT),
            end: reachablePoint(element, 'bottom', SCRUB_END_AT),
            scrub: true,
          },
        },
      );
    }, element);

    return () => context.revert();
  }, [reducedMotion]);

  return (
    <p ref={ref} className={className}>
      {words.map((word, index) => (
        <Fragment key={`${index}-${word}`}>
          {index > 0 ? ' ' : null}
          <span data-word>{word}</span>
        </Fragment>
      ))}
    </p>
  );
}
