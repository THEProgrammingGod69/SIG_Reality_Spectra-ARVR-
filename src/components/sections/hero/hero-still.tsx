import { seededRandom } from '@/lib/motion/random';

/**
 * The designed static frame of the Orbit Lab scene (D-017).
 *
 * Server-rendered SVG, coloured only by design tokens. It is:
 *   - the hero for reduced-motion and no-WebGL visitors (the static tier);
 *   - the first paint for everyone, while the 3D chunk loads, so nothing
 *     shifts when the canvas fades in over it;
 *   - what visitors without JavaScript see.
 *
 * Its composition mirrors the scene's layout (orbit-lab-scene.tsx): the orbit
 * sits right of the text on wide screens (aspect ≥ 23:20) and above it on tall
 * ones, with the planet's spectrum rim three-quarters of the way down.
 */

/** 1600 × 900 frame; the horizon crest sits at 75% of the height. */
const FRAME = { width: 1600, height: 900 } as const;
const HORIZON_Y = 675;
const PLANET_RADIUS = 1442;

const STARS = (() => {
  const random = seededRandom(3);
  return Array.from({ length: 72 }, () => ({
    cx: Math.round(random() * FRAME.width),
    // Down to the tall-screen horizon; on wide screens the planet covers the lowest.
    cy: Math.round(random() * (HORIZON_Y + 130)),
    r: +(0.6 + random() * 1.1).toFixed(2),
    opacity: +(0.25 + random() * 0.6).toFixed(2),
  }));
})();

const stop = (token: string, opacity = 1) => ({ stopColor: `var(${token})`, stopOpacity: opacity });

export function HeroStill() {
  return (
    <div className="absolute inset-0">
      <svg
        className="absolute inset-0 size-full"
        viewBox={`0 0 ${FRAME.width} ${FRAME.height}`}
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="hero-still-rim" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" style={stop('--color-spectra-violet', 0)} />
            <stop offset="0.35" style={stop('--color-spectra-violet')} />
            <stop offset="0.65" style={stop('--color-spectra-azure')} />
            <stop offset="1" style={stop('--color-spectra-azure', 0)} />
          </linearGradient>
          <radialGradient id="hero-still-glow">
            <stop offset="0" style={stop('--color-spectra-violet', 0.32)} />
            <stop offset="0.5" style={stop('--color-spectra-indigo', 0.12)} />
            <stop offset="1" style={stop('--color-spectra-indigo', 0)} />
          </radialGradient>
        </defs>

        <g style={{ fill: 'var(--color-silver)' }}>
          {STARS.map((star, i) => (
            <circle key={i} cx={star.cx} cy={star.cy} r={star.r} opacity={star.opacity} />
          ))}
        </g>

        {/* On tall screens the horizon drops to ≈ 91% so the text never sits on the crest. */}
        <g className="translate-y-[150px] [@media(min-aspect-ratio:23/20)]:translate-y-0">
          <circle
            cx={FRAME.width / 2}
            cy={HORIZON_Y + PLANET_RADIUS}
            r={PLANET_RADIUS}
            style={{ fill: 'var(--color-bg)' }}
            stroke="url(#hero-still-rim)"
            strokeWidth={2}
          />
          <ellipse
            cx={FRAME.width / 2}
            cy={HORIZON_Y}
            rx={760}
            ry={150}
            fill="url(#hero-still-glow)"
          />
        </g>
      </svg>

      <div className="absolute top-[33%] left-1/2 size-[min(109svh,147vw)] -translate-x-1/2 -translate-y-1/2 [@media(min-aspect-ratio:23/20)]:top-[48%] [@media(min-aspect-ratio:23/20)]:left-[72%] [@media(min-aspect-ratio:23/20)]:size-[min(109svh,80vw)]">
        <svg className="size-full" viewBox="-160 -160 320 320">
          <defs>
            <linearGradient id="hero-still-orbit" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0.2" style={stop('--color-spectra-orchid')} />
              <stop offset="0.8" style={stop('--color-spectra-azure')} />
            </linearGradient>
            <linearGradient id="hero-still-headset" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" style={stop('--color-spectra-magenta')} />
              <stop offset="0.5" style={stop('--color-silver')} />
              <stop offset="1" style={stop('--color-spectra-azure')} />
            </linearGradient>
          </defs>

          {/* Pulses, guides and the orbit with its satellite */}
          <g fill="none" stroke="url(#hero-still-orbit)">
            <circle r={48} strokeWidth={0.6} opacity={0.18} />
            <circle r={68} strokeWidth={0.6} opacity={0.12} />
            <circle r={152} strokeWidth={0.5} opacity={0.12} />
            <circle r={129} strokeWidth={0.6} opacity={0.2} />
            <circle r={100} strokeWidth={6} opacity={0.12} />
            <circle r={100} strokeWidth={1.2} opacity={0.9} />
          </g>
          <circle cx={86.6} cy={-50} r={2.6} style={{ fill: 'var(--color-spectra-cyan)' }} />

          {/* The wireframe headset */}
          <g fill="none" stroke="url(#hero-still-headset)" strokeWidth={1} strokeLinejoin="round">
            <g opacity={0.35}>
              <path d="M -52 6 Q -76 -40 6 -82 M 52 6 Q 78 -44 6 -82 M 0 -26 Q 2 -64 6 -82" />
              <rect x={-46} y={-31} width={108} height={51} rx={17.6} />
              <circle cx={-18} cy={-7} r={13} />
              <circle cx={30} cy={-7} r={13} />
              <path d="M -58.5 -29.5 L -46 -31 M 58.5 -29.5 L 62 -31 M -58.5 29.5 L -46 20 M 58.5 29.5 L 62 20" />
            </g>
            <rect x={-58.5} y={-29.5} width={117} height={59} rx={20.5} />
            <rect x={-45.5} y={-18} width={91} height={36} rx={12.7} opacity={0.8} />
            <circle cx={-34} cy={-10.7} r={2.4} />
            <circle cx={34} cy={-10.7} r={2.4} />
          </g>
        </svg>
      </div>
    </div>
  );
}
