'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';

import { cn } from '@/lib/cn';
import { gsap, ScrollTrigger } from '@/lib/motion/gsap';
import { readCssVar } from '@/lib/motion/tokens';

import { prefersReducedMotion, useReducedMotion } from './use-reduced-motion';

/** The same conditions as the `stack:` variant in globals.css. */
const STACKING =
  '(min-width: 48rem) and (min-height: 40rem) and (prefers-reduced-motion: no-preference)';

type StackProps = {
  /**
   * `<li>`s, each `stack:sticky` at its own `top`, holding one
   * `[data-stack-body]` (what shrinks) with a `[data-stack-scrim]` inside it
   * (what darkens). `MissionVision` shows the markup.
   */
  children: ReactNode;
  className?: string;
};

/**
 * Stack — our version of React Bits' ScrollStack (D-038).
 *
 * Panels stick one below another as the reader scrolls (CSS `position:
 * sticky`, the `stack:` variant), and each new panel slides up over the last,
 * which steps back: it shrinks to `--motion-shelve` and a scrim darkens it, as
 * if it moved deeper into the lab. Scrubbed by the scroll — it moves only
 * while the page does — from the moment the next panel starts to cover it to
 * the moment that panel lands, so a panel in full view is never dimmed. ScrollStack drove every card's `transform` from its own
 * per-frame loop with a Lenis instance of its own; here it is one scrubbed
 * tween per panel on the site's ScrollTrigger, `transform` and `opacity` only
 * (rule 4).
 *
 * Stuck panels report their stuck position, so trigger points are computed
 * from the list's own top and the panels' heights — where each panel sits in
 * the flow — and clamped to the page's maximum scroll, as `reachablePoint`
 * does. Below `md`, on short screens and under reduced motion nothing sticks
 * and nothing moves: the panels are a plain list.
 */
export function Stack({ children, className }: StackProps) {
  const ref = useRef<HTMLUListElement>(null);
  const reducedMotion = useReducedMotion();

  useLayoutEffect(() => {
    const list = ref.current;
    if (!list || reducedMotion || prefersReducedMotion()) return;
    const media = window.matchMedia(STACKING);
    if (!media.matches) return;

    const items = Array.from(list.children) as HTMLElement[];
    const shelve = parseFloat(readCssVar('--motion-shelve')) || 1;

    /** Where item `index` starts in the document, ignoring how far it is stuck. */
    const flowTop = (index: number) => {
      const style = getComputedStyle(list);
      const gap = parseFloat(style.rowGap) || 0;
      let top = list.getBoundingClientRect().top + window.scrollY + parseFloat(style.paddingTop);
      for (let i = 0; i < index; i += 1) top += items[i]!.offsetHeight + gap;
      return top;
    };
    const clamp = (value: number) => Math.min(value, ScrollTrigger.maxScroll(window) - 1);
    /** Where a panel sticks, from the top of the viewport (its computed `top`). */
    const stickyTop = (item: HTMLElement) => parseFloat(getComputedStyle(item).top) || 0;

    const context = gsap.context(() => {
      items.forEach((item, index) => {
        const next = items[index + 1];
        const body = item.querySelector('[data-stack-body]');
        if (!next || !body) return;
        const scrim = item.querySelector('[data-stack-scrim]');

        gsap
          .timeline({
            scrollTrigger: {
              trigger: list,
              // From the next panel starting to cover this one (until then this
              // panel is in full view, and stays at full strength)…
              start: () => clamp(flowTop(index + 1) - stickyTop(item) - item.offsetHeight),
              // …to it landing at its own sticky top.
              end: () => clamp(flowTop(index + 1) - stickyTop(next)),
              scrub: true,
              invalidateOnRefresh: true,
            },
          })
          .fromTo(body, { scale: 1 }, { scale: shelve, ease: 'none' }, 0)
          .fromTo(scrim, { opacity: 0 }, { opacity: 1, ease: 'none' }, 0);
      });
    }, list);

    // Leaving the stacking range (a resize) tears the effect down.
    const onChange = () => {
      if (!media.matches) context.revert();
    };
    media.addEventListener('change', onChange);

    return () => {
      media.removeEventListener('change', onChange);
      context.revert();
    };
  }, [reducedMotion]);

  return (
    <ul ref={ref} className={cn('flex flex-col', className)}>
      {children}
    </ul>
  );
}
