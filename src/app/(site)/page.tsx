import type { Metadata } from 'next';

import { Reveal } from '@/components/motion/reveal';
import { Hero } from '@/components/sections/hero/hero';
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
      <section aria-labelledby="home-next" className="mx-auto w-full max-w-3xl px-6 py-32">
        <Reveal>
          <h2 id="home-next" className="text-3xl font-semibold tracking-tight text-balance">
            Mission, vision and the core team
          </h2>
          <p className="mt-4 text-pretty text-(--color-muted)">{route.description}</p>
          <p className="mt-10 inline-flex rounded-full border border-(--color-border) bg-(--color-surface) px-4 py-1.5 font-mono text-xs text-(--color-muted)">
            Placeholder — built in Stage 4
          </p>
        </Reveal>
      </section>
    </>
  );
}
