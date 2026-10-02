import { ArrowRight } from 'lucide-react';

import { Reveal } from '@/components/motion/reveal';
import { ButtonLink } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Section } from '@/components/ui/section';
import { Eyebrow, Text } from '@/components/ui/text';
import type { SiteInfo } from '@/lib/schemas/content';

type AboutIntroProps = {
  motto: SiteInfo['motto'];
  about: SiteInfo['about']['short'];
};

/**
 * Home: "who we are", the first section after the hero. It opens under the
 * horizon glow — the board's light rising from the floor — so the hero's
 * scroll-out hands over into light that continues, not into a hard edge
 * (completes D-018).
 */
export function AboutIntro({ motto, about }: AboutIntroProps) {
  return (
    <Section labelledBy="about-intro" className="relative isolate overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[min(36rem,80svh)] bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,color-mix(in_oklab,var(--color-spectra-violet)_22%,transparent),transparent_70%)]"
      />
      <Reveal className="max-w-prose">
        <Eyebrow className="text-(--color-accent)">{motto}</Eyebrow>
        <Heading level={2} id="about-intro" className="mt-3">
          Who we are
        </Heading>
        <Text size="lg" className="mt-6">
          {about}
        </Text>
        <ButtonLink
          href="/about"
          variant="ghost"
          icon={ArrowRight}
          iconPosition="end"
          className="mt-8 -ml-6"
        >
          More about us
        </ButtonLink>
      </Reveal>
    </Section>
  );
}
