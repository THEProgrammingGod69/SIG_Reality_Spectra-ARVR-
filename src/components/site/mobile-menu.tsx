'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';

import { lockScroll } from '@/components/motion/scroll-lock';
import { Container } from '@/components/ui/container';
import { HudCorners } from '@/components/ui/hud-corners';
import { Eyebrow } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import type { Channels } from '@/lib/content';
import { gsap, gsapEase } from '@/lib/motion/gsap';
import { readMotionTokens } from '@/lib/motion/tokens';
import { clubCredit, siteRoutes } from '@/lib/site';

import { ChannelLinks } from './channel-links';
import { WhenRecruitmentOpen } from './recruitment-mark';

/**
 * Mobile menu (D-038, superseding the StaggeredMenu sweep of D-012): the
 * aperture. Five slats of the lab's surface close over the screen like a
 * shutter — from the centre out, alternately from above and below — a line of
 * light scans down once, and the pages rise into place, each with its number.
 * Closing reverses it: the links go dark and the slats open onto the page.
 * Every step is `transform` or `opacity` (rule 4).
 *
 * Kept from the StaggeredMenu rebuild: the Menu/Close label flips and the plus
 * turns into a cross; the closed panel is `inert`, opening moves focus to the
 * first link and traps Tab inside the menu, Escape closes it and returns focus
 * to the toggle, the page behind is inert and scroll-locked (Lenis included),
 * and a route change closes it. Durations and easings are motion tokens, so
 * under reduced motion it simply appears and disappears.
 *
 * The toggle sits in the header row and the panel behind it, so the header
 * calls `useMobileMenu()` once and renders both parts.
 */

export function useMobileMenu() {
  const pathname = usePathname();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  // `visible` outlives `open` while the close animation runs.
  const [visible, setVisible] = useState(false);

  // Close on navigation (including Back), adjusting state during render.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const barHRef = useRef<HTMLSpanElement>(null);
  const barVRef = useRef<HTMLSpanElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const hasOpenedRef = useRef(false);

  const toggle = useCallback(() => {
    setVisible(true);
    setOpen((current) => !current);
  }, []);
  const close = useCallback(() => setOpen(false), []);

  // Start with the shutter open: every slat folded flat against its edge.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.querySelectorAll<HTMLElement>('[data-menu-slat]').forEach((slat, index) => {
      gsap.set(slat, { scaleY: 0, transformOrigin: index % 2 === 0 ? 'top' : 'bottom' });
    });
  }, []);

  // Choreography, driven by `open`.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (!hasOpenedRef.current) {
      if (!open) return;
      hasOpenedRef.current = true;
    }

    const tokens = readMotionTokens();
    const outExpo = gsapEase(tokens, 'outExpo');
    const inOut = gsapEase(tokens, 'inOut');
    const { micro, short, medium, long } = tokens.dur;

    const slats = Array.from(root.querySelectorAll<HTMLElement>('[data-menu-slat]'));
    const scan = root.querySelector('[data-menu-scan]');
    const labels = root.querySelectorAll('[data-menu-label]');
    const numbers = root.querySelectorAll('[data-menu-number]');
    const extras = root.querySelectorAll('[data-menu-extra]');
    // The shutter closes and opens from the centre out.
    const fromCentre = { each: tokens.stagger, from: 'center' } as const;

    timelineRef.current?.kill();
    const timeline = gsap.timeline();

    if (open) {
      gsap.set(labels, { yPercent: 140, rotate: 4, opacity: 1 });
      gsap.set([numbers, extras], { opacity: 0 });
      gsap.set(extras, { y: tokens.rise });
      gsap.set(scan, { yPercent: 0, opacity: 0 });

      timeline.to(slats, { scaleY: 1, duration: medium, ease: outExpo, stagger: fromCentre }, 0);
      const closed = short + 2 * tokens.stagger;
      timeline
        .to(scan, { opacity: 1, duration: micro }, closed)
        .to(scan, { yPercent: 100, duration: long, ease: inOut }, closed)
        .to(scan, { opacity: 0, duration: short }, closed + long - short)
        .to(
          labels,
          { yPercent: 0, rotate: 0, duration: long, ease: outExpo, stagger: tokens.stagger },
          closed,
        )
        .to(numbers, { opacity: 1, duration: medium, stagger: tokens.stagger }, closed + micro)
        .to(
          extras,
          { y: 0, opacity: 1, duration: medium, ease: outExpo, stagger: tokens.stagger },
          closed + short,
        );
    } else {
      timeline.to([labels, numbers, extras], { opacity: 0, duration: micro, ease: inOut }, 0).to(
        slats,
        {
          scaleY: 0,
          duration: short,
          ease: inOut,
          stagger: fromCentre,
          onComplete: () => setVisible(false),
        },
        micro,
      );
    }

    // Toggle: Menu → Close label, plus → cross.
    timeline
      .to(labelRef.current, { yPercent: open ? -50 : 0, duration: short, ease: outExpo }, 0)
      .to(barHRef.current, { rotate: open ? 45 : 0, duration: short, ease: outExpo }, 0)
      .to(barVRef.current, { rotate: open ? -45 : 90, duration: short, ease: outExpo }, 0);

    timelineRef.current = timeline;
  }, [open]);

  useEffect(() => () => void timelineRef.current?.kill(), []);

  // While open: focus, trap, Escape, scroll lock and an inert page behind.
  useEffect(() => {
    const root = rootRef.current;
    const toggleButton = toggleRef.current;
    if (!open || !root || !toggleButton) return;

    const release = lockScroll();
    const behind = Array.from(
      document.querySelectorAll<HTMLElement>('#main-content, [data-site-footer], [data-skip-link]'),
    );
    behind.forEach((element) => (element.inert = true));

    const links = () => Array.from(root.querySelectorAll<HTMLElement>('a[href]'));
    links()[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;

      // Cycle through the toggle and the menu links only.
      const order = [toggleButton, ...links()];
      const index = order.indexOf(document.activeElement as HTMLElement);
      const next = event.shiftKey
        ? order[(index - 1 + order.length) % order.length]
        : order[(index + 1) % order.length];
      event.preventDefault();
      next?.focus();
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      behind.forEach((element) => (element.inert = false));
      release();
      // Hand focus back to the toggle if it was inside the menu.
      if (root.contains(document.activeElement) || document.activeElement === document.body) {
        toggleButton.focus();
      }
    };
  }, [open]);

  // Plain render state and the refs travel separately: render code reads only
  // `state`, and each ref goes straight to its element's `ref`.
  return {
    state: { open, visible, panelId, pathname, toggle, close },
    refs: { root: rootRef, toggle: toggleRef, label: labelRef, barH: barHRef, barV: barVRef },
  };
}

type MobileMenu = ReturnType<typeof useMobileMenu>;

export type MobileMenuState = MobileMenu['state'];
export type MobileMenuRefs = MobileMenu['refs'];

/**
 * The Menu/Close button, in the header row, framed by the HUD's corner ticks.
 * Hidden from `lg`, where HudNav takes over.
 */
export function MobileMenuToggle({
  menu,
  toggleRef,
  labelRef,
  barHRef,
  barVRef,
}: {
  menu: MobileMenuState;
  toggleRef: MobileMenuRefs['toggle'];
  labelRef: MobileMenuRefs['label'];
  barHRef: MobileMenuRefs['barH'];
  barVRef: MobileMenuRefs['barV'];
}) {
  return (
    <button
      ref={toggleRef}
      type="button"
      onClick={menu.toggle}
      aria-expanded={menu.open}
      aria-controls={menu.panelId}
      className="relative inline-flex h-10 cursor-pointer items-center gap-2.5 rounded-control px-3 font-mono text-label text-(--color-text) uppercase lg:hidden"
    >
      <span className="sr-only">{menu.open ? 'Close menu' : 'Open menu'}</span>
      <HudCorners className="text-(--color-accent)" cornerClassName="size-1.5" />
      <span
        aria-hidden="true"
        className="relative inline-block h-[1em] overflow-hidden leading-none"
      >
        <span ref={labelRef} className="flex flex-col">
          <span className="block h-[1em]">Menu</span>
          <span className="block h-[1em]">Close</span>
        </span>
      </span>
      <span
        aria-hidden="true"
        className="relative inline-flex size-3.5 items-center justify-center"
      >
        <span ref={barHRef} className="absolute h-0.5 w-full rounded-sm bg-current" />
        <span
          ref={barVRef}
          className="absolute h-0.5 w-full rounded-sm bg-current"
          // Initial turn as an inline transform, so GSAP animates from it.
          style={{ transform: 'rotate(90deg)' }}
        />
      </span>
    </button>
  );
}

const twoDigits = (n: number) => String(n).padStart(2, '0');

/** The aperture's slats. */
const SLATS = 5;

/** The full-screen panel, behind the header row. Every public page, numbered. */
export function MobileMenuPanel({
  menu,
  rootRef,
  channels,
  recruitmentOpen,
}: {
  menu: MobileMenuState;
  rootRef: MobileMenuRefs['root'];
  channels: Channels;
  /** Tags the Recruitment link while recruitment is open (the header CTA is hidden on phones). */
  recruitmentOpen: Promise<boolean>;
}) {
  return (
    <div
      ref={rootRef}
      inert={!menu.open}
      className={cn('fixed inset-0 overflow-hidden lg:hidden', !menu.visible && 'invisible')}
    >
      {/* The shutter: five slats that close over the page, and one line of light. */}
      <div aria-hidden="true" className="absolute inset-0 flex">
        {Array.from({ length: SLATS }, (_, slat) => (
          <span
            key={slat}
            data-menu-slat
            className="h-full flex-1 border-e border-(--color-border) bg-(--color-surface) bg-scanlines last:border-e-0"
          />
        ))}
      </div>
      <div aria-hidden="true" data-menu-scan className="absolute inset-0 opacity-0">
        <span className="absolute inset-x-0 top-0 h-px bg-(image:--gradient-rim)" />
      </div>
      <nav
        id={menu.panelId}
        aria-label="Site menu"
        data-lenis-prevent
        className="absolute inset-0 flex flex-col overflow-y-auto pt-header"
      >
        <Container className="flex flex-1 flex-col gap-12 py-10">
          <ol className="flex flex-col gap-3">
            {siteRoutes.map((route, i) => {
              const current = menu.pathname === route.href;
              return (
                <li
                  key={route.href}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 overflow-hidden"
                >
                  <Link
                    href={route.href}
                    onClick={menu.close}
                    aria-current={current ? 'page' : undefined}
                    className="flex items-baseline gap-4 py-1 font-display text-display-lg text-(--color-text) uppercase aria-[current=page]:text-(--color-accent)"
                  >
                    <span
                      data-menu-number
                      aria-hidden="true"
                      className="font-mono text-label text-(--color-accent)"
                    >
                      {twoDigits(i + 1)}
                    </span>
                    <span data-menu-label className="inline-block origin-bottom-left">
                      {route.label}
                    </span>
                  </Link>
                  {route.placement === 'cta' ? (
                    <WhenRecruitmentOpen open={recruitmentOpen}>
                      <span
                        data-menu-extra
                        className="rounded-full border border-(--color-accent)/40 px-2.5 py-1 font-mono text-label whitespace-nowrap text-(--color-accent) uppercase"
                      >
                        Open now
                      </span>
                    </WhenRecruitmentOpen>
                  ) : null}
                </li>
              );
            })}
          </ol>

          <div className="mt-auto flex flex-col gap-4">
            <ChannelLinks data-menu-extra channels={channels} className="gap-x-6" />
            <Eyebrow data-menu-extra>{clubCredit}</Eyebrow>
          </div>
        </Container>
      </nav>
    </div>
  );
}
