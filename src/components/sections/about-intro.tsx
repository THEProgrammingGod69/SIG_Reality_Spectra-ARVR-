import { ArrowRight } from 'lucide-react';

import { ScrollWords } from '@/components/motion/scroll-words';
import { SplitText } from '@/components/motion/split-text';
import { Tilt } from '@/components/motion/tilt';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { HudCorners } from '@/components/ui/hud-corners';
import { Section } from '@/components/ui/section';
import { Text } from '@/components/ui/text';
import type { SiteInfo } from '@/lib/schemas/content';

import { EyebrowDash } from './section-heading';

type AboutIntroProps = {
  motto: SiteInfo['motto'];
  about: SiteInfo['about']['short'];
  /** The lit "About Reality Spectra" card (D-039). */
  card: SiteInfo['about']['card'];
};

/**
 * Home: "who we are", the first section after the hero. It opens under the
 * horizon glow — the board's light rising from the floor — so the hero's
 * scroll-out hands over into light that continues, not into a hard edge
 * (completes D-018).
 *
 * Editorial layout (D-037): the label column on the left, and the short
 * "about us" set large on the right as a statement, its words brightening as
 * the reader scrolls through it (`ScrollWords`). Under it, the club in one
 * line as a lit card that leans toward the pointer (`Card spotlight` in
 * `Tilt`, with HUD corners locking on under the pointer) — the "About Reality
 * Spectra" card from the teammate's "Who we are" section on main, rebuilt on
 * the project's own primitives (D-039).
 */
export function AboutIntro({ motto, about, card }: AboutIntroProps) {
  return (
    <Section labelledBy="about-intro" className="relative isolate overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[min(36rem,80svh)] bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,color-mix(in_oklab,var(--color-spectra-violet)_22%,transparent),transparent_70%)]"
      />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.2fr)] lg:gap-16">
        <div>
          <EyebrowDash className="text-(--color-accent)">{motto}</EyebrowDash>
          <Heading level={2} id="about-intro" className="mt-4">
            <SplitText text="Who we are" />
          </Heading>
        </div>
        <div>
          <ScrollWords
            text={about}
            className="font-display text-display-md text-pretty text-(--color-text)"
          />
          <Tilt className="mt-10 h-auto max-w-2xl">
            <Card as="div" featured spotlight className="group/about">
              <HudCorners
                className="inset-3 scale-110 text-(--color-spectra-cyan) opacity-0 transition-[scale,opacity] duration-(--dur-medium) ease-out-expo group-hover/about:scale-100 group-hover/about:opacity-100"
                cornerClassName="size-3"
              />
              <CardBody className="gap-4 p-8 sm:p-10">
                <Heading level={3} size="sm">
                  {card.title}
                </Heading>
                <Text size="lg">{card.body}</Text>
              </CardBody>
            </Card>
          </Tilt>
          <ButtonLink
            href="/about"
            variant="ghost"
            icon={ArrowRight}
            iconPosition="end"
            className="mt-10 -ml-6"
          >
            More about us
          </ButtonLink>
        </div>
      </div>
    </Section>
  );
}
