import { cn } from '@/lib/cn';

/** Top-left, top-right, bottom-right, bottom-left: two arms each. */
const CORNERS = [
  'top-0 left-0 border-t border-l',
  'top-0 right-0 border-t border-r',
  'right-0 bottom-0 border-r border-b',
  'bottom-0 left-0 border-b border-l',
] as const;

type HudCornersProps = {
  /**
   * The frame: where it sits (`inset-*`, positioned in a `relative` parent),
   * its colour (`text-*`; the arms are `currentColor`) and any reveal
   * (`opacity`/`scale` on a group state).
   */
  className?: string;
  /** Each corner's size (`size-*`); `--reticle-size` by default. */
  cornerClassName?: string;
};

/**
 * The HUD's corner brackets (D-038) — the one shape behind the hero's display
 * frame, the navigation's ticks, the menu toggle, the targeting reticle and
 * the lock-on over a team pass or a domain card. Decorative (`aria-hidden`),
 * no pointer events, static: callers animate the frame with `transform` and
 * `opacity` only.
 */
export function HudCorners({ className, cornerClassName }: HudCornersProps) {
  return (
    <span aria-hidden="true" className={cn('pointer-events-none absolute inset-0', className)}>
      {CORNERS.map((corner) => (
        <span key={corner} className={cn('hud-corner', corner, cornerClassName)} />
      ))}
    </span>
  );
}
