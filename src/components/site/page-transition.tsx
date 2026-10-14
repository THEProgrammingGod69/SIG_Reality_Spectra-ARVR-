'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, type AnimationEvent, type ReactNode } from 'react';

import { prefersReducedMotion } from '@/components/motion/use-reduced-motion';
import { siteRoutes } from '@/lib/site';

/** Becomes true after the first page has hydrated; later pages are navigations. */
const session = { hydrated: false };

/** The shutter's slats; they lift alternately up and down, from the centre out. */
const SLATS = 5;
/** The shutter holds closed this many staggers, so the destination's name can be read. */
const HOLD = 3;
const twoDigits = (n: number) => String(n).padStart(2, '0');

/**
 * Route change, rendered by `(site)/template.tsx` (a template remounts on
 * every navigation, a layout does not).
 *
 * The new page arrives behind a shutter (D-038): five slats of the lab's
 * surface cover the screen under the header and lift off it — alternately up
 * and down, from the centre out, a stagger apart — while the destination's
 * number and name show through and fade. The header stays put above it, as a
 * headset's display does while the world behind it changes. `scaleY` and
 * `opacity` only, on keyframe tokens (`animate-shutter`, `-shutter-label`), so
 * no animation library loads for it (D-033), and it never takes a click.
 *
 * The page itself only fades in (opacity, no transform on this wrapper: a
 * transformed ancestor would break the hero's pinned scroll-out). The first
 * page load never animates: the hero name must be visible at first paint
 * (D-010), so only client-side navigations do. Under reduced motion there is
 * no shutter at all, and the fade's duration token is zero.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  // Decided once per mount; false during hydration so server and client agree.
  const [animate] = useState(() => typeof window !== 'undefined' && session.hydrated);
  const [shutter, setShutter] = useState(() => animate && !prefersReducedMotion());

  useEffect(() => {
    session.hydrated = true;
  }, []);

  return (
    <>
      <div className={animate ? 'animate-fade-in' : undefined}>{children}</div>
      {/* After the page, so `#main-content > div:first-child` is always the page. */}
      {shutter ? <Shutter onDone={() => setShutter(false)} /> : null}
    </>
  );
}

function Shutter({ onDone }: { onDone: () => void }) {
  const pathname = usePathname();
  const index = siteRoutes.findIndex((route) => route.href === pathname);
  const route = index === -1 ? null : siteRoutes[index];
  const centre = (SLATS - 1) / 2;

  // Unmount once every slat has lifted and the name has faded.
  const onAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    const running = event.currentTarget
      .getAnimations({ subtree: true })
      .some((animation) => animation.playState !== 'finished');
    if (!running) onDone();
  };

  return (
    <div
      aria-hidden="true"
      data-shutter
      onAnimationEnd={onAnimationEnd}
      className="pointer-events-none fixed inset-0 z-(--z-shutter) flex"
    >
      {Array.from({ length: SLATS }, (_, slat) => (
        <span
          key={slat}
          // Centre first, then outward: 2, then 1 and 3, then 0 and 4.
          style={{ animationDelay: `calc(var(--stagger) * ${HOLD + Math.abs(slat - centre)})` }}
          className={`h-full flex-1 animate-shutter border-e border-(--color-border) bg-(--color-surface) last:border-e-0 ${slat % 2 === 0 ? 'origin-top' : 'origin-bottom'}`}
        />
      ))}
      {route ? (
        <span className="absolute inset-0 flex animate-shutter-label items-center justify-center gap-4 font-mono text-label text-(--color-muted) uppercase">
          <span className="text-(--color-accent)">
            {twoDigits(index + 1)} / {twoDigits(siteRoutes.length)}
          </span>
          <span className="h-px w-8 bg-(image:--gradient-spectra)" />
          <span className="text-(--color-text)">{route.label}</span>
        </span>
      ) : null}
    </div>
  );
}
