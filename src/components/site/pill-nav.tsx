'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useLayoutEffect, useRef } from 'react';

import { prefersReducedMotion, useReducedMotion } from '@/components/motion/use-reduced-motion';
import { cn } from '@/lib/cn';
import { gsap, gsapEase } from '@/lib/motion/gsap';
import { readMotionTokens } from '@/lib/motion/tokens';

/**
 * Desktop navigation (D-012) — our version of React Bits' PillNav.
 *
 * Kept: on hover or keyboard focus, a circle rises inside the pill while the
 * label slides out and a second copy slides in — `scale`, `y` and `opacity`
 * only. Changed, as the D-013 review required:
 *   - `react-router-dom` replaced by `next/link` + `usePathname` (typed routes);
 *   - the load-in animation tweened `width` (rule 4) — removed;
 *   - `role="menubar"`/`menuitem` removed: these are site links, and menu
 *     roles promise arrow-key behaviour the original never implemented;
 *   - its own mobile dropdown removed — mobile uses MobileMenu;
 *   - the spinning logo removed (the header owns the logo);
 *   - colours, durations and easings from tokens; reduced motion skips the
 *     animation and keeps a plain colour change on hover.
 */

type PillNavProps = {
  items: readonly { readonly href: Route; readonly label: string }[];
  className?: string;
};

export function PillNav({ items, className }: PillNavProps) {
  const pathname = usePathname();
  const listRef = useRef<HTMLUListElement>(null);
  const timelinesRef = useRef<(gsap.core.Timeline | null)[]>([]);
  const tweensRef = useRef<(gsap.core.Tween | null)[]>([]);
  const reducedMotion = useReducedMotion();

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list || reducedMotion || prefersReducedMotion()) return;

    const context = gsap.context(() => {}, list);
    const tweens = tweensRef.current;

    // Size each pill's circle so its arc just covers the pill, then build a
    // paused timeline that hover scrubs to the end and back.
    const layout = () =>
      context.add(() => {
        timelinesRef.current.forEach((timeline) => timeline?.kill());
        timelinesRef.current = Array.from(list.querySelectorAll<HTMLElement>('[data-pill]')).map(
          (pill) => {
            const circle = pill.querySelector<HTMLElement>('[data-pill-circle]');
            const label = pill.querySelector<HTMLElement>('[data-pill-label]');
            const hover = pill.querySelector<HTMLElement>('[data-pill-hover]');
            if (!circle || !label || !hover) return null;

            // Radius of the circle through the pill's bottom corners and top centre.
            const { width: w, height: h } = pill.getBoundingClientRect();
            const r = ((w * w) / 4 + h * h) / (2 * h);
            const diameter = Math.ceil(2 * r) + 2;
            const delta = Math.ceil(r - Math.sqrt(Math.max(0, r * r - (w * w) / 4))) + 1;

            circle.style.width = `${diameter}px`;
            circle.style.height = `${diameter}px`;
            circle.style.bottom = `-${delta}px`;
            gsap.set(circle, {
              xPercent: -50,
              scale: 0,
              transformOrigin: `50% ${diameter - delta}px`,
            });
            gsap.set(label, { y: 0 });
            gsap.set(hover, { y: h + 12, opacity: 0 });

            return gsap
              .timeline({ paused: true, defaults: { ease: 'none', duration: 1 } })
              .to(circle, { scale: 1.2, xPercent: -50 }, 0)
              .to(label, { y: -(h + 8) }, 0)
              .to(hover, { y: 0, opacity: 1 }, 0);
          },
        );
      });

    layout();
    window.addEventListener('resize', layout);
    document.fonts?.ready.then(layout).catch(() => {});

    return () => {
      window.removeEventListener('resize', layout);
      tweens.forEach((tween) => tween?.kill());
      context.revert();
    };
  }, [items, reducedMotion]);

  const scrub = useCallback((index: number, entering: boolean) => {
    const timeline = timelinesRef.current[index];
    if (!timeline) return;
    const tokens = readMotionTokens();
    tweensRef.current[index]?.kill();
    tweensRef.current[index] = timeline.tweenTo(entering ? timeline.duration() : 0, {
      duration: entering ? tokens.dur.short : tokens.dur.micro,
      ease: gsapEase(tokens, 'outExpo'),
    });
  }, []);

  return (
    <nav aria-label="Primary" className={cn('hidden lg:block', className)}>
      <ul
        ref={listRef}
        className="flex h-11 items-center gap-1 rounded-full border border-(--color-border) bg-(--color-glass) p-1 backdrop-blur-glass"
      >
        {items.map((item, index) => {
          const current = pathname === item.href;
          return (
            <li key={item.href} className="h-full">
              <Link
                href={item.href}
                data-pill
                aria-current={current ? 'page' : undefined}
                onPointerEnter={() => scrub(index, true)}
                onPointerLeave={() => scrub(index, false)}
                onFocus={() => scrub(index, true)}
                onBlur={() => scrub(index, false)}
                className="relative inline-flex h-full items-center overflow-hidden rounded-full px-4 text-body-sm font-medium text-(--color-muted) hover:text-(--color-text) aria-[current=page]:text-(--color-text)"
              >
                <span
                  data-pill-circle
                  aria-hidden="true"
                  className="pointer-events-none absolute left-1/2 block rounded-full bg-(--color-text)"
                />
                <span className="relative inline-block leading-none">
                  <span data-pill-label className="relative inline-block">
                    {item.label}
                  </span>
                  <span
                    data-pill-hover
                    aria-hidden="true"
                    className="absolute top-0 left-0 inline-block text-(--color-bg) opacity-0"
                  >
                    {item.label}
                  </span>
                </span>
                {current ? (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-(--color-accent)"
                  />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
