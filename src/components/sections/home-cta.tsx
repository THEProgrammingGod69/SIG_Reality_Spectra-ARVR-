import { ArrowRight } from 'lucide-react';

import { Reveal } from '@/components/motion/reveal';
import { SplitText } from '@/components/motion/split-text';
import { ButtonLink } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { LabBackdrop } from '@/components/ui/lab-backdrop';
import { Section } from '@/components/ui/section';
import { Text } from '@/components/ui/text';
import { getRoute } from '@/lib/site';

import { EyebrowDash } from './section-heading';

const recruitmentRoute = getRoute('/recruitment');
const contactRoute = getRoute('/contact');

/**
 * Home, last: the closing call to action (D-037), set in the lab — the orbit
 * centred behind it, as one luminous object. Two ways in: the domains and
 * recruitment, or a collaboration through Contact. The orbit opens around the
 * reader as they arrive (`motion="portal"`, D-038). Says nothing about whether
 * recruitment is open, so it is never wrong: /recruitment says that.
 */
export function HomeCta({ motto }: { motto: string }) {
  return (
    <Section labelledBy="home-cta" className="relative isolate overflow-hidden">
      <LabBackdrop align="center" motion="portal" />
      <div className="mx-auto flex max-w-3xl flex-col items-center py-12 text-center md:py-20">
        <EyebrowDash>{motto}</EyebrowDash>
        <Heading level={2} id="home-cta" size="xl" className="mt-5">
          <SplitText text="Build the next reality with us" highlight="reality" />
        </Heading>
        <Reveal className="flex flex-col items-center">
          <Text size="lg" tone="muted" className="mt-6 max-w-prose">
            Pick the domain that fits you, join the next recruitment drive, or bring the club a
            workshop, a sponsorship or a collaboration.
          </Text>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href={recruitmentRoute.href} variant="star" size="lg" magnetic>
              Find your domain
            </ButtonLink>
            <ButtonLink
              href={contactRoute.href}
              variant="secondary"
              size="lg"
              icon={ArrowRight}
              iconPosition="end"
            >
              Work with us
            </ButtonLink>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
