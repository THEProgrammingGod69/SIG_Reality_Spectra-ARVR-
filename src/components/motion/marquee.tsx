import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

/**
 * Room around each separator. Each item carries its own trailing space (gap
 * plus end padding), so a copy's width is exactly the sum of its items and
 * sliding by half the track lands precisely on the second copy.
 */
const spacings = {
  md: 'gap-x-6 pe-6',
  lg: 'gap-x-10 pe-10',
} as const;

type MarqueeProps = {
  /** What scrolls past, in order; drawn twice so the loop has no seam. */
  items: readonly ReactNode[];
  /** Run right-to-left (default) or left-to-right. */
  reverse?: boolean;
  /** Drawn after every item, the last included, so the seam matches. */
  separator?: ReactNode;
  spacing?: keyof typeof spacings;
  className?: string;
};

/**
 * Marquee — our version of React Bits' ScrollVelocity / LogoLoop (D-037),
 * without either's per-frame script.
 *
 * A track holding the items twice slides by exactly one copy and repeats
 * (`animate-marquee`, a `transform` keyframe on the `--dur-marquee` token),
 * so the loop is seamless and runs on the compositor. It pauses under the
 * mouse, and under reduced motion it does not move at all (the global rule
 * ends every animation at once). The edges fade with a static mask.
 *
 * Decorative only: the whole band is `aria-hidden`, so use it for text that
 * the page also states properly elsewhere (the Home domain ticker repeats the
 * domain list beneath it). A server component: no JavaScript ships for it.
 */
export function Marquee({
  items,
  reverse = false,
  separator,
  spacing = 'lg',
  className,
}: MarqueeProps) {
  const copy = (key: string) => (
    <div key={key} className="flex shrink-0 items-center">
      {items.map((item, index) => (
        <div key={index} className={cn('flex shrink-0 items-center', spacings[spacing])}>
          {item}
          {separator}
        </div>
      ))}
    </div>
  );

  return (
    <div
      aria-hidden="true"
      className={cn('flex overflow-hidden mask-x-from-85% mask-x-to-100% select-none', className)}
    >
      <div
        className={cn(
          'flex w-max shrink-0 animate-marquee hover:[animation-play-state:paused]',
          reverse && '[animation-direction:reverse]',
        )}
      >
        {copy('a')}
        {copy('b')}
      </div>
    </div>
  );
}
