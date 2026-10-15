'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { DecodeText } from '@/components/motion/decode-text';
import { HudCorners } from '@/components/ui/hud-corners';
import { cn } from '@/lib/cn';

type HudNavProps = {
  items: readonly { readonly href: Route; readonly label: string }[];
  className?: string;
};

const twoDigits = (n: number) => String(n).padStart(2, '0');

/**
 * Desktop navigation (D-038, replacing PillNav of D-012): the headset's HUD
 * rail. A glass strip with its own corner ticks; each page is a numbered mono
 * readout.
 *
 * A lock-on frame — two pairs of corner brackets — rests on the current page.
 * It glides to whichever link the pointer or keyboard focus is on and back
 * when it leaves; the leading pair moves first and the trailing pair follows
 * a stagger later, so the frame stretches and settles like a tracking
 * reticle. A spectrum hairline under it does the same. The label decodes like
 * a readout coming online (`DecodeText`). At the end, a live readout of how far
 * down the page the reader is.
 *
 * Only `transform` and `opacity` move (rule 4): the brackets slide with
 * `translateX`, the hairline is one element scaled with `scaleX`. Durations
 * and easings are tokens, so reduced motion makes the frame jump and the
 * labels never decode. Links are ordinary links with ordinary names: the
 * number is `aria-hidden`, and the decoding copy is too.
 */
export function HudNav({ items, className }: HudNavProps) {
  const pathname = usePathname();
  const listRef = useRef<HTMLUListElement>(null);
  const leadRef = useRef<HTMLSpanElement>(null);
  const trailRef = useRef<HTMLSpanElement>(null);
  const lineRef = useRef<HTMLSpanElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);
  const lastLeftRef = useRef<number | null>(null);
  const [aimed, setAimed] = useState<Route | null>(null);
  const [replays, setReplays] = useState<Partial<Record<Route, number>>>({});

  const current = items.find((item) => item.href === pathname)?.href ?? null;
  const focus = aimed ?? current;

  /** Put the frame and the hairline on the focused link (or hide them). */
  const place = useCallback(() => {
    const list = listRef.current;
    const lead = leadRef.current;
    const trail = trailRef.current;
    const line = lineRef.current;
    if (!list || !lead || !trail || !line) return;

    const link = focus
      ? list.querySelector<HTMLElement>(`[data-hud-link="${CSS.escape(focus)}"]`)
      : null;
    const frame = lead.parentElement;
    if (!link || !frame) {
      frame?.setAttribute('data-idle', 'true');
      lastLeftRef.current = null;
      return;
    }

    const left = link.offsetLeft;
    const width = link.offsetWidth;
    const arm = lead.offsetWidth;
    const previous = lastLeftRef.current;
    // The pair on the side it moves toward leads; the other trails a stagger behind.
    const rightward = previous === null || left >= previous;
    lead.style.transitionDelay = rightward ? 'var(--stagger)' : '0s';
    trail.style.transitionDelay = rightward ? '0s' : 'var(--stagger)';
    // From hidden, the frame appears in place rather than sliding in from the side.
    const instant = frame.getAttribute('data-idle') === 'true' || previous === null;
    frame.toggleAttribute('data-instant', instant);

    lead.style.transform = `translateX(${left}px)`;
    trail.style.transform = `translateX(${left + width - arm}px)`;
    line.style.transform = `translateX(${left}px) scaleX(${width / list.offsetWidth})`;
    // Commit the instant placement now, before transitions come back on.
    if (instant) void frame.offsetWidth;
    frame.setAttribute('data-idle', 'false');
    lastLeftRef.current = left;
  }, [focus]);

  useLayoutEffect(() => {
    place();
    // The next placement animates.
    const frame = leadRef.current?.parentElement;
    const id = requestAnimationFrame(() => frame?.removeAttribute('data-instant'));
    return () => cancelAnimationFrame(id);
  }, [place]);

  useEffect(() => {
    const onResize = () => place();
    window.addEventListener('resize', onResize);
    document.fonts?.ready.then(onResize).catch(() => {});
    return () => window.removeEventListener('resize', onResize);
  }, [place]);

  // How far down the page: a three-digit readout, written once per frame.
  useEffect(() => {
    const readout = readoutRef.current;
    if (!readout) return;
    let frame = 0;
    const apply = () => {
      frame = 0;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
      readout.textContent = String(Math.round(progress * 100)).padStart(3, '0');
    };
    const schedule = () => {
      frame ||= requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      cancelAnimationFrame(frame);
    };
  }, [pathname]);

  const aim = (href: Route) => {
    setAimed(href);
    setReplays((counts) => ({ ...counts, [href]: (counts[href] ?? 0) + 1 }));
  };
  const release = (href: Route) => setAimed((value) => (value === href ? null : value));

  return (
    <nav aria-label="Primary" className={cn('hidden lg:block', className)}>
      <div className="relative flex h-11 items-center rounded-control border border-(--color-border) bg-(--color-glass) ps-1.5 pe-3 backdrop-blur-glass">
        <HudCorners className="-inset-px text-(--color-accent)" cornerClassName="size-2" />

        <ul ref={listRef} className="relative flex h-full items-center">
          {items.map((item, index) => (
            <li key={item.href} className="h-full">
              <Link
                href={item.href}
                data-hud-link={item.href}
                aria-current={item.href === current ? 'page' : undefined}
                onPointerEnter={() => aim(item.href)}
                onPointerLeave={() => release(item.href)}
                onFocus={() => aim(item.href)}
                onBlur={() => release(item.href)}
                className="group/hud relative inline-flex h-full items-center gap-2 rounded-control px-3.5 font-mono text-label text-(--color-muted) uppercase hover:text-(--color-text) aria-[current=page]:text-(--color-text)"
              >
                <span
                  aria-hidden="true"
                  className="text-(--color-subtle) group-aria-[current=page]/hud:text-(--color-accent)"
                >
                  {twoDigits(index + 1)}
                </span>
                <DecodeText text={item.label} trigger="manual" replay={replays[item.href] ?? 0} />
              </Link>
            </li>
          ))}

          {/* The lock-on frame and its hairline. */}
          <li
            aria-hidden="true"
            data-idle="true"
            className="group/frame pointer-events-none absolute inset-0 text-(--color-spectra-cyan) opacity-100 transition-opacity duration-(--dur-short) ease-out-expo data-[idle=true]:opacity-0"
          >
            <span
              ref={leadRef}
              className="absolute inset-y-1.5 left-0 w-2 transition-transform duration-(--dur-medium) ease-out-expo group-data-instant/frame:transition-none"
            >
              <span className="hud-corner top-0 left-0 size-2 border-t border-l" />
              <span className="hud-corner bottom-0 left-0 size-2 border-b border-l" />
            </span>
            <span
              ref={trailRef}
              className="absolute inset-y-1.5 left-0 w-2 transition-transform duration-(--dur-medium) ease-out-expo group-data-instant/frame:transition-none"
            >
              <span className="hud-corner top-0 right-0 size-2 border-t border-r" />
              <span className="hud-corner right-0 bottom-0 size-2 border-r border-b" />
            </span>
            <span
              ref={lineRef}
              className="absolute inset-x-0 -bottom-px h-px origin-left bg-(image:--gradient-spectra) transition-transform duration-(--dur-medium) ease-out-expo group-data-instant/frame:transition-none"
            />
          </li>
        </ul>

        <span
          aria-hidden="true"
          className="ms-2 border-s border-(--color-border) ps-3 font-mono text-label text-(--color-subtle) tabular-nums"
        >
          <span ref={readoutRef}>000</span>%
        </span>
      </div>
    </nav>
  );
}
