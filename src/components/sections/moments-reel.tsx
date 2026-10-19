'use client';

import Image from 'next/image';
import { useLayoutEffect, useRef, useSyncExternalStore, type CSSProperties } from 'react';

import { prefersReducedMotion, useReducedMotion } from '@/components/motion/use-reduced-motion';
import { HudCorners } from '@/components/ui/hud-corners';
import { cn } from '@/lib/cn';
import { coverSizes } from '@/lib/image-sizes';
import { gsap, gsapEase } from '@/lib/motion/gsap';
import { reachablePoint } from '@/lib/motion/scroll-point';
import { readCssVar, readMotionTokens } from '@/lib/motion/tokens';

/** One photo, or one clip's poster frame. Captions and alt text are content. */
export type Moment = {
  key: string;
  src: string;
  alt: string;
  caption: string;
  /** The category as a reader sees it ("Hackathon"), shown as a mono label. */
  categoryLabel: string;
  width: number;
  height: number;
};

/**
 * Places around the ring, and so the most moments the reel shows. Fewer
 * moments fill an arc of the same ring rather than a smaller, tighter one,
 * so the ring keeps one size whatever the count; the rest are a click away
 * in the gallery.
 */
export const REEL_SLOTS = 12;

/** The ring from `md`; below it, the strip. */
const WIDE = '(min-width: 48rem)';
function subscribeToWide(onChange: () => void) {
  const media = window.matchMedia(WIDE);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}
const isWide = () => window.matchMedia(WIDE).matches;

/**
 * Fetch each card at the width it renders: the ring card or the strip card,
 * widened by the photo's shape, since the 4:5 card crops it (`coverSizes`).
 */
const CARD_SIZES = '(min-width: 48rem) 15rem, 72vw';
const CARD_RATIO = 4 / 5;

/**
 * The ring's geometry, all in CSS from the tokens: each card is a step of the
 * circle further round, and the radius is the one at which neighbouring cards
 * sit `--reel-gap` apart (a regular polygon of `--reel-slots` sides of
 * `--reel-card + --reel-gap`).
 */
const ringGeometry = {
  '--reel-slots': REEL_SLOTS,
  '--reel-step': 'calc(360deg / var(--reel-slots))',
  '--reel-radius':
    'calc((var(--reel-card) + var(--reel-gap)) / (2 * tan(180deg / var(--reel-slots))))',
} as CSSProperties;

/**
 * Home: moments from the lab as a reel, after React Bits' CircularGallery —
 * rebuilt in CSS 3D, because that one draws with `ogl` (D-011).
 *
 * From `md`, with JavaScript and without reduced motion (`data-reel="on"`),
 * the cards stand around a ring: each one `rotateY` a step further round and
 * pushed out by the radius, the stage holding the perspective, backs hidden.
 * The ring turns as the section scrolls through the viewport — scrubbed, so
 * it moves only while the page does (WCAG 2.2.2), the first moment facing the
 * reader as the reel arrives and the last as it leaves — and it leans a few
 * degrees toward a mouse pointer, eased. Cards turning away dim under a scrim,
 * and HUD brackets hold still around the place facing the reader.
 * Only `transform` and `opacity` change (rule 4); the section scrolls
 * normally, nothing is pinned.
 *
 * Phones, no JavaScript and reduced motion: the same cards are a horizontal
 * scroll-snap strip, a focusable region the keyboard can scroll, with no 3D.
 *
 * Every card is real content — the photo with its alt text, a mono category
 * label and the caption (clamped to two lines) — so the moments read the same
 * in either form. 0 moments renders nothing; past `REEL_SLOTS` they are cut.
 */
export function MomentsReel({
  moments,
  label,
  className,
}: {
  moments: readonly Moment[];
  /** The strip's accessible name. */
  label: string;
  className?: string;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const leanRef = useRef<HTMLDivElement>(null);
  const turnRef = useRef<HTMLUListElement>(null);
  const reducedMotion = useReducedMotion();
  const wide = useSyncExternalStore(subscribeToWide, isWide, () => false);
  // Off during hydration (both stores report their server value), so the
  // server HTML and the first client render agree.
  const on = wide && !reducedMotion;
  const shown = moments.slice(0, REEL_SLOTS);
  const count = shown.length;

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const lean = leanRef.current;
    const turn = turnRef.current;
    if (!on || prefersReducedMotion() || !stage || !lean || !turn || count === 0) return;

    const tokens = readMotionTokens();
    const maxLean = parseFloat(readCssVar('--reel-lean')) || 0;
    const step = 360 / REEL_SLOTS;
    const scrims = Array.from(turn.querySelectorAll<HTMLElement>('[data-reel-scrim]'));

    // A card's scrim thickens as it turns away from the reader: clear face on,
    // full at edge-on (past that its back is hidden anyway).
    const shade = () => {
      const angle = Number(gsap.getProperty(turn, 'rotationY')) || 0;
      scrims.forEach((scrim, index) => {
        const facing = Math.cos(((index * step + angle) * Math.PI) / 180);
        scrim.style.opacity = String(1 - Math.max(0, facing));
      });
    };

    const context = gsap.context(() => {
      // First moment face on as the reel enters, the last as it leaves.
      gsap.fromTo(
        turn,
        { rotationY: 0 },
        {
          rotationY: -(count - 1) * step,
          ease: 'none',
          onUpdate: shade,
          scrollTrigger: {
            trigger: stage,
            start: reachablePoint(stage, 'top', 1),
            end: reachablePoint(stage, 'bottom', 0),
            scrub: true,
          },
        },
      );
    }, stage);
    shade();

    // The lean toward a mouse pointer, eased on a token. Touch and pen scroll
    // the page; they never lean the ring.
    const fine = window.matchMedia('(pointer: fine)').matches;
    const leanX = gsap.quickTo(lean, 'rotationX', {
      duration: tokens.dur.medium,
      ease: gsapEase(tokens, 'outExpo'),
    });
    const leanY = gsap.quickTo(lean, 'rotationY', {
      duration: tokens.dur.medium,
      ease: gsapEase(tokens, 'outExpo'),
    });
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      const rect = stage.getBoundingClientRect();
      // -0.5 … 0.5 across the stage, from its centre.
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      leanX(-y * 2 * maxLean);
      leanY(x * 2 * maxLean);
    };
    const onLeave = () => {
      leanX(0);
      leanY(0);
    };
    if (fine) {
      stage.addEventListener('pointermove', onMove, { passive: true });
      stage.addEventListener('pointerleave', onLeave);
    }

    return () => {
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerleave', onLeave);
      context.revert();
      gsap.killTweensOf(lean);
      gsap.set(lean, { clearProps: 'transform' });
      for (const scrim of scrims) scrim.style.opacity = '';
    };
  }, [on, count]);

  if (count === 0) return null;

  return (
    <div
      data-moments-reel
      data-reel={on ? 'on' : 'off'}
      style={ringGeometry}
      className={cn('relative', className)}
    >
      <div
        ref={stageRef}
        role="region"
        aria-label={label}
        tabIndex={on ? undefined : 0}
        className="snap-x snap-mandatory scroll-ps-(--reel-inset) overflow-x-auto overscroll-x-contain pb-4 [--reel-inset:max(var(--spacing-gutter),calc((100%-var(--container-content))/2+var(--spacing-gutter)))] reel:snap-none reel:overflow-x-clip reel:overflow-y-visible reel:mask-x-from-80% reel:mask-x-to-100% reel:py-10 reel:perspective-(--reel-perspective)"
      >
        <div ref={leanRef} className="relative reel:transform-3d">
          {/* The reading position (D-038): HUD brackets frame the place where
              a moment faces the reader, and the ring turns each one into it. */}
          <span className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-(--reel-card) -translate-x-1/2 reel:block">
            <HudCorners className="-inset-3 text-(--color-spectra-cyan)" cornerClassName="size-4" />
          </span>
          <div className="reel:[transform:translateZ(calc(var(--reel-radius)*-1))] reel:transform-3d">
            <ul
              ref={turnRef}
              className="flex w-max gap-4 ps-(--reel-inset) pe-gutter reel:grid reel:w-auto reel:justify-center reel:p-0 reel:transform-3d"
            >
              {shown.map((moment, index) => (
                <li
                  key={moment.key}
                  style={{ '--reel-index': index } as CSSProperties}
                  className="w-(--reel-strip-card) shrink-0 snap-start reel:col-start-1 reel:row-start-1 reel:w-(--reel-card) reel:[transform:rotateY(calc(var(--reel-index)*var(--reel-step)))_translateZ(var(--reel-radius))] reel:backface-hidden"
                >
                  <figure className="relative flex h-full flex-col overflow-hidden rounded-card border border-(--color-border) bg-(--color-surface)">
                    <div className="aspect-4/5 overflow-hidden bg-(--color-surface-raised)">
                      <Image
                        src={moment.src}
                        alt={moment.alt}
                        width={moment.width}
                        height={moment.height}
                        sizes={coverSizes(CARD_SIZES, moment, CARD_RATIO)}
                        className="size-full object-cover"
                      />
                    </div>
                    <figcaption className="flex flex-col gap-2 p-4">
                      <span className="truncate font-mono text-label text-(--color-accent) uppercase">
                        {moment.categoryLabel}
                      </span>
                      <span className="line-clamp-2 text-body-sm wrap-anywhere text-(--color-text)">
                        {moment.caption}
                      </span>
                    </figcaption>
                    <span
                      aria-hidden="true"
                      data-reel-scrim
                      className="pointer-events-none absolute inset-0 bg-(--color-bg)/70 opacity-0"
                    />
                  </figure>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
