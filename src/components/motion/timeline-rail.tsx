'use client';

import { useLayoutEffect, useRef } from 'react';

import { cn } from '@/lib/cn';
import { gsap, ScrollTrigger } from '@/lib/motion/gsap';
import { reachablePoint } from '@/lib/motion/scroll-point';

import { prefersReducedMotion, useReducedMotion } from './use-reduced-motion';

/**
 * The line the reader's eye is on, 60% down the viewport: the rail fills to
 * it and markers light as they cross it (clamped to the end of the page, so
 * the last marker always lights).
 */
const READING_LINE = 0.6;

/**
 * The events timeline's rail (D-037): a hairline track down the start edge of
 * its parent, and a spectrum fill that follows the reader down it, scrubbed by
 * the scroll position (`scaleY`, rule 4). Each `[data-timeline-marker]` in the
 * parent lights as the reader reaches it: `data-lit` on the marker, which the
 * marker styles with opacity and scale.
 *
 * Nothing is dimmed without JavaScript or under reduced motion: the markers
 * are only dimmed once this sets `data-armed` on the parent, and reduced
 * motion shows the rail full and every marker lit, as the static design.
 *
 * Place it as the first child of a `relative` wrapper around the list, and
 * mark each entry with a `TimelineMarker`.
 */
export function TimelineRail() {
  const fillRef = useRef<HTMLSpanElement>(null);
  const reducedMotion = useReducedMotion();

  useLayoutEffect(() => {
    const fill = fillRef.current;
    const host = fill?.parentElement?.parentElement;
    if (!fill || !host) return;

    if (reducedMotion || prefersReducedMotion()) {
      fill.style.transform = 'scaleY(1)';
      return;
    }

    const markers = Array.from(host.querySelectorAll<HTMLElement>('[data-timeline-marker]'));
    host.dataset.armed = 'true';

    const context = gsap.context(() => {
      gsap.fromTo(
        fill,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: host,
            start: reachablePoint(host, 'top', READING_LINE),
            end: reachablePoint(host, 'bottom', READING_LINE),
            scrub: true,
          },
        },
      );
      for (const marker of markers) {
        ScrollTrigger.create({
          trigger: marker,
          start: reachablePoint(marker, 'center', READING_LINE),
          onEnter: () => (marker.dataset.lit = 'true'),
          onLeaveBack: () => delete marker.dataset.lit,
        });
      }
    }, host);

    return () => {
      context.revert();
      delete host.dataset.armed;
      for (const marker of markers) delete marker.dataset.lit;
    };
  }, [reducedMotion]);

  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 start-0 w-px">
      <span className="absolute inset-0 bg-(--color-border)" />
      <span
        ref={fillRef}
        // Inline, not `scale-y-0`: Tailwind's scale utilities set the separate
        // `scale` property, which would multiply with GSAP's transform.
        style={{ transform: 'scaleY(0)' }}
        className="absolute inset-0 origin-top bg-linear-to-b from-(--color-spectra-orchid) via-(--color-spectra-violet) to-(--color-spectra-azure)"
      />
    </span>
  );
}

/**
 * An entry's point of light on the rail. Lit by default (no JavaScript,
 * reduced motion); once the rail is armed it waits dimmed and small until the
 * reader reaches it — `opacity` and `scale` only. Position it onto the rail
 * with `className` (a negative start offset equal to the list's indent).
 */
export function TimelineMarker({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      data-timeline-marker
      className={cn(
        'absolute top-1.5 size-2.5 rounded-full bg-(--color-accent) shadow-glow transition-[opacity,scale] duration-(--dur-medium) ease-out-expo [[data-armed]_&:not([data-lit])]:scale-50 [[data-armed]_&:not([data-lit])]:opacity-30',
        className,
      )}
    />
  );
}
