import type { Metadata } from 'next';

import { Reveal } from '@/components/motion/reveal';
import { Hero } from '@/components/sections/hero/hero';
import { Badge } from '@/components/ui/badge';
import { Heading } from '@/components/ui/heading';
import { Section } from '@/components/ui/section';
import { Text } from '@/components/ui/text';
import { getRoute } from '@/lib/site';

const route = getRoute('/');

export const metadata: Metadata = {
  // Home keeps the root layout's default title (no '| SIG Reality Spectra' suffix).
  description: route.description,
  alternates: { canonical: route.href },
};

export default function HomePage() {
  return (
    <>
      <Hero />

      {/* TEMPORARY (Stage 2): stands in for mission, vision and the core team,
          which Stage 4 builds. It also gives the hero's scroll-out somewhere
          to hand over to. */}
      <Section labelledBy="home-next" width="prose">
        <Reveal>
          <Heading level={2} id="home-next">
            Mission, vision and the core team
          </Heading>
          <Text size="lg" tone="muted" className="mt-4">
            {route.description}
          </Text>
          <Badge className="mt-10">Placeholder — built in Stage 4</Badge>
        </Reveal>
      </Section>
    </>
  );
}
