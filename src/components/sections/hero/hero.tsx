import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Eyebrow, Text } from '@/components/ui/text';
import { clubCredit, getRoute, siteConfig } from '@/lib/site';

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
 * The hero is full-bleed: it runs underneath the fixed header, and its text
 * clears the header with `pt-header`. On tall screens the text sits at the
 * bottom, and the horizon crest is at ≈ 91% of the height (hero-still.tsx,
 * orbit-lab-scene.tsx), so the bottom padding of 14svh keeps the buttons
 * above the crest.
 *
 * The one-line intro comes from src/content/site.json, passed in by the page.
 */
export function Hero({ tagline }: { tagline: string }) {
  return (
    <HeroStage labelledBy={TITLE_ID} still={<HeroStill />}>
      <Container className="flex flex-col justify-end pt-header pb-[max(4rem,14svh)] [@media(min-aspect-ratio:23/20)]:justify-center [@media(min-aspect-ratio:23/20)]:pb-24">
        <div className="max-w-xl">
          <Eyebrow>{clubCredit}</Eyebrow>

          <HeroTitle
            id={TITLE_ID}
            text={siteConfig.name}
            className="mt-4 font-display text-display-2xl text-balance text-(--color-text)"
          />

          <Text size="lg" className="mt-6 max-w-md">
            {tagline}
          </Text>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <ButtonLink href={eventsRoute.href} magnetic>
              Explore events
            </ButtonLink>
            <ButtonLink href={recruitmentRoute.href} variant="secondary">
              Join the club
            </ButtonLink>
          </div>
        </div>
      </Container>
    </HeroStage>
  );
}
