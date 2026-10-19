import { DecodeText } from '@/components/motion/decode-text';
import { HudCorners } from '@/components/ui/hud-corners';
import { siteConfig } from '@/lib/site';

/**
 * The hero seen through the headset (D-038): a display frame whose corners
 * lock on as the page opens (`animate-lock-on`), one line of light scanning
 * down the scene once (`animate-scan`), a depth ruler down the left edge, and
 * two readouts — the realities the club works in, with a status light, and
 * the motto. All of it decorative (`aria-hidden`; the motto is a readout here,
 * the page says it in words further down) and server-rendered.
 *
 * It sits between the scene and the text (`-z-5`), inside the hero's content
 * layer, so it fades with the text on the scroll-out. Readouts show only where
 * the hero has room for them: from `md`, and the motto on wide screens, where
 * the text is centred and the foot is free. Reduced motion: the frame is
 * simply there, and the scan never crosses.
 */
export function HeroHud({ motto }: { motto: string }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-5 select-none">
      {/* One scan of light down the scene, then gone. */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-x-0 top-0 h-full animate-scan"
          style={{ animationDelay: 'calc(var(--stagger) * 10)' }}
        >
          <span className="block h-px bg-(image:--gradient-rim)" />
          <span className="block h-24 bg-linear-to-b from-(--color-spectra-azure)/10 to-transparent" />
        </div>
      </div>

      {/* The display frame. */}
      <div className="absolute inset-x-gutter top-[calc(var(--spacing-header)+--spacing(2))] bottom-6 animate-lock-on text-(--color-border-strong)">
        <HudCorners cornerClassName="size-6" />

        {/* Depth ruler: a tick every half grid cell, a longer one every two cells. */}
        <span className="absolute top-1/2 left-0 hidden h-64 w-3 -translate-y-1/2 bg-[repeating-linear-gradient(to_bottom,var(--color-border-strong)_0_1px,transparent_1px_calc(var(--grid-cell)/2))] lg:block" />
        <span className="absolute top-1/2 left-0 hidden h-64 w-5 -translate-y-1/2 bg-[repeating-linear-gradient(to_bottom,var(--color-subtle)_0_1px,transparent_1px_calc(var(--grid-cell)*2))] lg:block" />

        <span className="absolute top-4 right-4 hidden items-center gap-3 font-mono text-label text-(--color-muted) uppercase md:flex">
          <span className="relative flex size-1.5">
            <span className="absolute inset-0 animate-ping-soft rounded-full bg-(--color-spectra-cyan)" />
            <span className="relative size-1.5 rounded-full bg-(--color-spectra-cyan)" />
          </span>
          <DecodeText text={siteConfig.realities.join(' · ')} />
        </span>

        <span className="absolute bottom-4 left-4 hidden font-mono text-label text-(--color-subtle) uppercase [@media(min-aspect-ratio:23/20)]:md:block">
          <DecodeText text={motto} />
        </span>
      </div>
    </div>
  );
}
