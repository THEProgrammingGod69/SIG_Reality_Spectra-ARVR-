'use client';

import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { useLayoutEffect, useRef, useSyncExternalStore, type ReactNode } from 'react';

import { Spotlight } from '@/components/motion/spotlight';
import { prefersReducedMotion, useReducedMotion } from '@/components/motion/use-reduced-motion';
import { Container } from '@/components/ui/container';
import { Icon } from '@/components/ui/icon';
import { gsap, gsapEase, ScrollTrigger } from '@/lib/motion/gsap';
import { reachablePoint } from '@/lib/motion/scroll-point';
import { readCssVar, readMotionTokens } from '@/lib/motion/tokens';

export type RailDomain = {
  id: string;
  number: string;
  name: string;
  /** Technical or Non-technical: the half of the club it belongs to. */
  group: string;
};

/**
 * The rail runs from `md`, on screens tall enough to hold its frame (a phone
 * on its side is not); elsewhere the domains are a grid.
 */
const WIDE = '(min-width: 48rem) and (min-height: 40rem)';
function subscribeToWide(onChange: () => void) {
  const media = window.matchMedia(WIDE);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}
const isWide = () => window.matchMedia(WIDE).matches;

/** Scroll speed (CSS px per second) that produces the full lean, `--motion-lean`. */
const LEAN_SPEED = 2400;

/**
 * Home: the domains as a rail (D-038). From `md`, the section holds still
 * while the reader scrolls, and the domain panels travel across it instead —
 * vertical scroll becomes horizontal travel. Each panel's great hollow numeral
 * drifts against the panel as it passes (depth), the panels lean into the
 * direction of travel with the scroll's speed and straighten as it stops, and
 * a readout counts the domains through.
 *
 * Every panel is a plain link named by its domain, to its card on
 * /recruitment; the numerals, group labels and arrows are `aria-hidden`.
 *
 * How it holds still: the section is made as tall as the travel plus a screen,
 * and its inner frame is `position: sticky` — no pinning, so nothing in the
 * DOM is moved. Only `transform` changes (rule 4): the track's `x`, the
 * numerals' `xPercent`, the panels' `skewX`, the readout's `scaleX`. Keyboard
 * focus on a panel scrolls the page to the point where that panel is in view.
 *
 * Below `md`, without JavaScript, and under reduced motion the rail is never
 * switched on (`data-rail`): the same links are a two-column grid, at rest.
 */
export function DomainRail({
  domains,
  heading,
}: {
  domains: readonly RailDomain[];
  heading: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const reducedMotion = useReducedMotion();
  const wide = useSyncExternalStore(subscribeToWide, isWide, () => false);
  // Off during hydration (both stores report their server value), so the
  // server HTML and the first client render agree.
  const on = wide && !reducedMotion;

  useLayoutEffect(() => {
    const root = rootRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const bar = barRef.current;
    const count = countRef.current;
    if (!on || prefersReducedMotion() || !root || !viewport || !track || !bar || !count) return;

    const tokens = readMotionTokens();
    const maxLean = parseFloat(readCssVar('--motion-lean')) || 0;
    const panels = Array.from(track.querySelectorAll<HTMLElement>('[data-rail-panel]'));
    const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
    // The section is the travel plus one screen tall; measured before every refresh.
    const size = () => {
      root.style.height = `${window.innerHeight + distance()}px`;
    };
    size();
    ScrollTrigger.addEventListener('refreshInit', size);

    let trigger: ScrollTrigger | undefined;
    const context = gsap.context(() => {
      // The lean eases back to upright on the token duration once scrolling stops.
      const leanTo = gsap.quickTo(panels, 'skewX', {
        duration: tokens.dur.medium,
        ease: gsapEase(tokens, 'outExpo'),
      });
      let settle: gsap.core.Tween | null = null;
      const lean = (degrees: number) => {
        leanTo(degrees);
        settle?.kill();
        settle = gsap.delayedCall(tokens.dur.micro, () => leanTo(0));
      };

      const travel = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: root,
          start: reachablePoint(root, 'top', 0),
          end: reachablePoint(root, 'bottom', 1),
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            bar.style.transform = `scaleX(${self.progress})`;
            const index = Math.min(domains.length, Math.floor(self.progress * domains.length) + 1);
            count.textContent = String(index).padStart(2, '0');
            lean(Math.max(-1, Math.min(1, self.getVelocity() / LEAN_SPEED)) * -maxLean);
          },
        },
      });
      trigger = travel.scrollTrigger;

      // Each numeral drifts against its panel as the panel crosses the screen.
      for (const panel of panels) {
        const numeral = panel.querySelector('[data-rail-numeral]');
        if (!numeral) continue;
        gsap.fromTo(
          numeral,
          { xPercent: 25 },
          {
            xPercent: -25,
            ease: 'none',
            scrollTrigger: {
              trigger: panel,
              containerAnimation: travel,
              start: 'left right',
              end: 'right left',
              scrub: true,
            },
          },
        );
      }
    }, root);

    // A panel reached by keyboard: scroll the page to where it is in view. Only
    // keyboard focus (`:focus-visible`): a click focuses the link on mousedown,
    // and moving the rail then would pull the panel out from under the pointer.
    const onFocus = (event: FocusEvent) => {
      const target = event.target as Element | null;
      const panel = target?.closest<HTMLElement>('[data-rail-panel]');
      if (!panel || !trigger || !target?.matches(':focus-visible')) return;
      const box = panel.getBoundingClientRect();
      const frame = viewport.getBoundingClientRect();
      if (box.left >= frame.left && box.right <= frame.right) return;
      const travel = distance();
      if (travel <= 0) return;
      const centre = panel.offsetLeft + panel.offsetWidth / 2 - viewport.clientWidth / 2;
      const progress = Math.min(1, Math.max(0, centre / travel));
      window.scrollTo({
        top: trigger.start + progress * (trigger.end - trigger.start),
        behavior: 'instant',
      });
    };
    track.addEventListener('focusin', onFocus);

    ScrollTrigger.refresh();

    return () => {
      track.removeEventListener('focusin', onFocus);
      ScrollTrigger.removeEventListener('refreshInit', size);
      context.revert();
      root.style.height = '';
      ScrollTrigger.refresh();
    };
  }, [on, domains.length]);

  return (
    <div ref={rootRef} data-domain-rail data-rail={on ? 'on' : 'off'} className="relative">
      <div className="py-section rail:sticky rail:top-0 rail:flex rail:h-svh rail:flex-col rail:justify-center rail:gap-10 rail:overflow-x-clip rail:py-0 rail:pt-header">
        <Container>{heading}</Container>

        <div ref={viewportRef} className="mt-12 rail:mt-0">
          <ul
            ref={trackRef}
            className="mx-auto grid max-w-content grid-cols-1 gap-3 px-gutter sm:grid-cols-2 rail:mx-0 rail:flex rail:w-max rail:max-w-none rail:gap-5 rail:ps-[max(var(--spacing-gutter),calc((100%-var(--container-content))/2+var(--spacing-gutter)))] rail:pe-gutter"
          >
            {domains.map((domain) => (
              <li key={domain.id} data-rail-panel className="rail:w-(--rail-panel) rail:shrink-0">
                <Link
                  href={`/recruitment#${domain.id}` as const}
                  className="group/panel relative isolate flex h-full items-center gap-4 overflow-hidden rounded-card border border-(--color-border) bg-(--color-surface) p-4 hover:border-(--color-border-strong) rail:h-(--rail-panel-height) rail:flex-col rail:items-stretch rail:justify-between rail:gap-0 rail:p-7"
                >
                  <Spotlight />
                  <span
                    aria-hidden="true"
                    className="flex items-center justify-between gap-3 font-mono text-label text-(--color-accent) uppercase"
                  >
                    {domain.number}
                    <span className="hidden text-(--color-muted) rail:inline">{domain.group}</span>
                  </span>

                  <span
                    aria-hidden="true"
                    className="pointer-events-none hidden flex-1 items-center justify-center rail:flex"
                  >
                    <span
                      data-rail-numeral
                      className="font-display text-numeral text-outline transition-[scale] duration-(--dur-long) ease-out-expo group-hover/panel:scale-110"
                    >
                      {domain.number}
                    </span>
                  </span>

                  <span className="flex flex-1 items-center justify-between gap-4 rail:flex-none rail:border-t rail:border-(--color-border) rail:pt-5">
                    <span className="font-display text-body text-(--color-text) rail:text-display-sm">
                      {domain.name}
                    </span>
                    <Icon
                      icon={ArrowUpRight}
                      size="md"
                      className="shrink-0 text-(--color-muted) transition-transform duration-(--dur-short) ease-out-expo group-hover/panel:translate-x-0.5 group-hover/panel:-translate-y-0.5 group-hover/panel:text-(--color-accent)"
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Readout: which domain the rail is on, and how far through. */}
        <Container aria-hidden="true" className="hidden items-center gap-4 rail:flex">
          <span className="font-mono text-label text-(--color-muted) tabular-nums">
            <span ref={countRef} className="text-(--color-text)">
              01
            </span>{' '}
            / {String(domains.length).padStart(2, '0')}
          </span>
          <span className="relative h-px flex-1 overflow-hidden bg-(--color-border)">
            <span
              ref={barRef}
              className="absolute inset-0 origin-left bg-(image:--gradient-spectra)"
              style={{ transform: 'scaleX(0)' }}
            />
          </span>
          <span className="font-mono text-label text-(--color-subtle) uppercase">Scroll</span>
        </Container>
      </div>
    </div>
  );
}
