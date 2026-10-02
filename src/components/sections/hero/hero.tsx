import Link from 'next/link';

import { getRoute, siteConfig } from '@/lib/site';

import { HeroStage } from './hero-stage';
import { HeroStill } from './hero-still';
import { HeroTitle } from './hero-title';

const TITLE_ID = 'hero-title';

const eventsRoute = getRoute('/events');
const recruitmentRoute = getRoute('/recruitment');

/**
 * The landing hero — Orbit Lab (D-001).
 *
 * Server-rendered: the name, intro line and calls to action are real text in
 * the HTML at first paint (D-010), on top of the static still. `HeroStage`
 * then decides whether this device gets the 3D scene and choreographs it.
 *
 * Copy: the one-line intro is the Stage 1 tagline until the club supplies the
 * real line (docs/OPEN_ITEMS.md #4). Buttons are interim styling; Stage 3's
 * Button primitive replaces them. The "recruitment open" badge arrives with
 * recruitment settings in Stage 8.
 */
export function Hero() {
  return (
    <HeroStage labelledBy={TITLE_ID} still={<HeroStill />}>
      <div className="mx-auto flex w-full max-w-6xl flex-col justify-end px-6 pt-24 pb-16 sm:pb-20 [@media(min-aspect-ratio:23/20)]:justify-center [@media(min-aspect-ratio:23/20)]:pb-24">
        <div className="max-w-xl">
          <p className="font-mono text-xs tracking-widest text-(--color-muted) uppercase">
            Special Interest Group · {siteConfig.parentOrganisation}
          </p>

          <HeroTitle
            id={TITLE_ID}
            text={siteConfig.name}
            className="mt-4 text-5xl font-semibold tracking-tight text-balance text-(--color-text) sm:text-6xl lg:text-7xl"
          />

          <p className="mt-6 max-w-md text-lg text-pretty text-(--color-text-body)">
            {siteConfig.tagline}
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              href={eventsRoute.href}
              className="rounded-full bg-(--color-accent) px-6 py-2.5 text-sm font-medium text-(--color-accent-contrast) transition-opacity duration-(--dur-micro) hover:opacity-90"
            >
              Explore events
            </Link>
            <Link
              href={recruitmentRoute.href}
              className="rounded-full border border-(--color-border-strong) px-6 py-2.5 text-sm font-medium text-(--color-text) transition-colors duration-(--dur-micro) hover:border-(--color-accent)"
            >
              Join the club
            </Link>
          </div>
        </div>
      </div>
    </HeroStage>
  );
}
