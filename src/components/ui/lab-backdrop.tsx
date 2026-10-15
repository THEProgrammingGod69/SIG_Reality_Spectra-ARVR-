import { Parallax } from '@/components/motion/parallax';
import { cn } from '@/lib/cn';

const stop = (token: string, opacity = 1) => ({ stopColor: `var(${token})`, stopOpacity: opacity });

/** Where the orbit sits: off the top-right corner (page intros) or centred (calls to action). */
const placements = {
  end: {
    rings:
      'top-0 right-0 size-[min(52rem,150vw)] translate-x-[38%] -translate-y-[42%] md:translate-x-[28%]',
    glow: 'top-0 right-0 h-[32rem] w-[48rem] translate-x-1/4 -translate-y-1/3',
    grid: 'mask-radial-at-top-right',
    // The intro's lower edge is where the page continues: fade into it.
    root: 'mask-b-from-55% mask-b-to-100%',
    // On the ring (viewBox units), up and to the right: out in the corner.
    satellite: { cx: 70.7, cy: -70.7, className: undefined },
  },
  center: {
    rings: 'top-1/2 left-1/2 size-[min(56rem,170vw)] -translate-x-1/2 -translate-y-1/2',
    glow: 'top-1/2 left-1/2 h-[28rem] w-[56rem] -translate-x-1/2 -translate-y-1/2',
    grid: 'mask-radial-at-center',
    root: 'mask-y-from-70% mask-y-to-100%',
    // At the top of the ring, above centred text — and only from `md`: on a
    // phone the ring is small enough that it would land on the heading.
    satellite: { cx: 0, cy: -100, className: 'hidden md:block' },
  },
} as const;

type LabBackdropProps = {
  align?: keyof typeof placements;
  /**
   * How the lab answers the scroll (D-038): `drift` — the orbit turns and the
   * light sinks as the section scrolls away (page intros); `portal` — the orbit
   * opens around the reader as they arrive (calls to action).
   */
  motion?: 'drift' | 'portal';
  className?: string;
};

/**
 * The lab, behind a page's opening (D-037): the hero's Orbit Lab motif (D-001)
 * carried onto every page at a whisper — a hairline grid floor fading out from
 * one corner, a pool of violet light, and the orbit rings with their
 * satellite. One luminous object per section, as the board asks.
 *
 * Decorative and server-rendered: `aria-hidden`, no pointer events, colours
 * only from tokens. As the page opens, the rings turn into place and the
 * light rises and spreads (`animate-orbit`, `animate-drift`: transform and
 * opacity, `--dur-settle`, under 5 s), then the lab is still — nothing loops.
 * Then it answers the scroll (`Parallax`, D-038): the orbit turns or opens
 * and the light drifts while the reader scrolls, and only then. Reduced
 * motion shows it at rest. Place it in a `relative isolate` section.
 */
export function LabBackdrop({ align = 'end', motion = 'drift', className }: LabBackdropProps) {
  const place = placements[align];

  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 -z-10 overflow-hidden',
        place.root,
        className,
      )}
    >
      <div
        className={cn(
          'absolute inset-0 bg-lab-grid mask-radial-from-0% mask-radial-to-70% opacity-40',
          place.grid,
        )}
      />

      <div className={cn('absolute', place.glow)}>
        <Parallax depth={motion === 'drift' ? -1 : 0}>
          <div className="size-full animate-drift rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--color-spectra-violet)_20%,transparent),color-mix(in_oklab,var(--color-spectra-indigo)_8%,transparent)_55%,transparent)]" />
        </Parallax>
      </div>

      <div className={cn('absolute', place.rings)}>
        <Parallax turn={motion === 'drift' ? 1 : 0} portal={motion === 'portal'}>
          <svg className="size-full animate-orbit" viewBox="-160 -160 320 320">
            <defs>
              <linearGradient id={`lab-orbit-${align}`} x1="0" x2="1" y1="0" y2="1">
                <stop offset="0.15" style={stop('--color-spectra-orchid', 0.9)} />
                <stop offset="0.85" style={stop('--color-spectra-azure', 0.9)} />
              </linearGradient>
            </defs>
            <g fill="none" stroke={`url(#lab-orbit-${align})`}>
              <circle r={156} strokeWidth={0.4} opacity={0.14} />
              <circle r={128} strokeWidth={0.5} opacity={0.22} />
              <circle r={100} strokeWidth={0.8} opacity={0.38} />
              <circle r={72} strokeWidth={0.4} opacity={0.14} />
            </g>
            <g className={place.satellite.className}>
              <circle
                cx={place.satellite.cx}
                cy={place.satellite.cy}
                r={2.4}
                style={{ fill: 'var(--color-spectra-cyan)' }}
              />
              <circle
                cx={place.satellite.cx}
                cy={place.satellite.cy}
                r={7}
                opacity={0.25}
                style={{ fill: 'var(--color-spectra-cyan)' }}
              />
            </g>
          </svg>
        </Parallax>
      </div>
    </div>
  );
}
