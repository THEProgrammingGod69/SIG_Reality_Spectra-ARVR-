'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';

import { LatticeLoader } from '@/components/react-bits/lattice-loader/lattice-loader';
import { ScrollExpand } from '@/components/react-bits/scroll-expand/scroll-expand';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';

const clamp = (value: number) => Math.min(1, Math.max(0.01, value));
const HOLD_VIEWPORTS = 0.35;

export function UpcomingEvent() {
  const sectionRef = useRef<HTMLElement>(null);
  const rafRef = useRef<number | null>(null);
  const [progress, setProgress] = useState(0.01);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const update = () => {
      rafRef.current = null;
      const holdDistance = window.innerHeight * HOLD_VIEWPORTS;
      const range = Math.max(section.offsetHeight - window.innerHeight - holdDistance, 1);
      const start = section.getBoundingClientRect().top + window.scrollY;
      setProgress(clamp((window.scrollY - start) / range));
    };
    const onScroll = () => {
      if (rafRef.current === null) rafRef.current = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', update);
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const eventProgress = Math.min(1, Math.max(0, (progress - 0.68) / 0.32));
  const loading = progress < 0.99;

  return (
    <section
      ref={sectionRef}
      aria-labelledby="upcoming-event"
      data-event-progress={Math.round(progress * 100)}
      className="relative min-h-[180svh] pt-0 pb-section"
    >
      <ScrollExpand progress={progress} reducedMotion={Boolean(reducedMotion)}>
        <Image
          src="/events/upcoming-event.svg"
          alt="Temporary abstract visual for the upcoming Reality Spectra event"
          fill
          sizes="(min-width: 64rem) 75rem, 100vw"
          className="object-cover"
          style={{ opacity: 0.2 + eventProgress * 0.8 }}
        />
        <div className="absolute inset-0 bg-linear-to-t from-(--color-void) via-(--color-void)/50 to-transparent" />

        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-6 text-center"
          style={{ opacity: loading ? 1 : 0, transform: `translateY(${eventProgress * -1.5}rem)` }}
          aria-hidden={!loading}
        >
          <LatticeLoader />
          <p className="font-display text-display-md text-(--color-text)">{Math.round(progress * 100)}%</p>
          <p className="font-mono text-label text-(--color-muted) uppercase">Scroll to reveal</p>
        </div>

        <div
          className="absolute inset-0 grid items-end gap-8 p-6 md:grid-cols-[1.1fr_0.9fr] md:items-center md:p-12"
          style={{ opacity: eventProgress, transform: `translateY(${(1 - eventProgress) * 1.5}rem)` }}
          aria-hidden={loading}
        >
          <div className="max-w-prose">
            <p className="font-mono text-label text-(--color-accent) uppercase">Upcoming event</p>
            <Heading level={2} id="upcoming-event" className="mt-4 text-display-xl">
              Something Exciting Is Coming
            </Heading>
            <p className="mt-5 font-mono text-label text-(--color-silver) uppercase">Coming soon</p>
            <Text className="mt-6">
              A temporary preview for the next Reality Spectra experience. The event poster and final details will be added here once the programme is announced.
            </Text>
            <dl className="mt-8 grid gap-3 font-mono text-label text-(--color-muted) uppercase sm:grid-cols-3">
              <div><dt>Date</dt><dd className="mt-1 text-(--color-silver)">To be announced</dd></div>
              <div><dt>Venue</dt><dd className="mt-1 text-(--color-silver)">To be announced</dd></div>
              <div><dt>Status</dt><dd className="mt-1 text-(--color-silver)">Details soon</dd></div>
            </dl>
          </div>
          <p className="max-w-xs justify-self-end font-mono text-label text-(--color-silver) uppercase">
            An immersive moment is taking shape.
          </p>
        </div>
      </ScrollExpand>
    </section>
  );
}
