'use client';

import { useState, useSyncExternalStore } from 'react';

import { DecodeText } from '@/components/motion/decode-text';
import { FocusText } from '@/components/motion/focus-text';
import { HoloFoil } from '@/components/motion/holo-foil';
import { Magnetic } from '@/components/motion/magnetic';
import { Marquee } from '@/components/motion/marquee';
import { Parallax } from '@/components/motion/parallax';
import { Reveal } from '@/components/motion/reveal';
import { ScrollFloat } from '@/components/motion/scroll-float';
import { ScrollWords } from '@/components/motion/scroll-words';
import { SplitText } from '@/components/motion/split-text';
import { Stagger } from '@/components/motion/stagger';
import { TimelineMarker, TimelineRail } from '@/components/motion/timeline-rail';
import { useMotionTokens } from '@/components/motion/use-motion-tokens';
import { useReducedMotion } from '@/components/motion/use-reduced-motion';
import { useHeroTier } from '@/components/three/use-hero-tier';
import { Button, ButtonLink } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { HudCorners } from '@/components/ui/hud-corners';
import { Text } from '@/components/ui/text';
import { readHeroTierSignals, type HeroTier } from '@/lib/motion/hero-tier';
import { DURATION_TOKENS } from '@/lib/motion/tokens';

import { DevPageHeader, DevPanel } from '../_components/dev-panel';

const TIER_LINKS: readonly HeroTier[] = ['high', 'low', 'static'];

/* The hero tier signals, read once in the browser. */
let signalSnapshot: string | null = null;
function getSignals() {
  signalSnapshot ??= JSON.stringify(readHeroTierSignals(), null, 2);
  return signalSnapshot;
}
const noSubscribe = () => () => {};

export function MotionPlayground() {
  const reducedMotion = useReducedMotion();
  const decision = useHeroTier();
  const tokens = useMotionTokens();
  const signalsJson = useSyncExternalStore(noSubscribe, getSignals, () => null);

  const [sweep, setSweep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [rise, setRise] = useState(0);

  return (
    <div className="flex flex-col gap-8">
      <DevPageHeader title="Motion playground">
        Every motion primitive in isolation. Toggle your operating system&apos;s “reduce motion”
        setting to watch each one fall back to a static render.
      </DevPageHeader>

      <div className="grid gap-6 md:grid-cols-2">
        <DevPanel title="Environment">
          <dl className="flex flex-col gap-2 text-body-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-(--color-muted)">prefers-reduced-motion</dt>
              <dd className="font-mono">{reducedMotion ? 'reduce' : 'no-preference'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-(--color-muted)">Hero tier</dt>
              <dd className="font-mono">
                {decision ? `${decision.tier} (${decision.reason})` : '…'}
              </dd>
            </div>
          </dl>
          <pre className="mt-4 overflow-x-auto rounded-control bg-(--color-bg) p-3 font-mono text-label text-(--color-muted)">
            {signalsJson ?? '…'}
          </pre>
          <Text size="sm" tone="muted" className="mt-4">
            Open the hero in a forced tier:
          </Text>
          <div className="mt-2 flex flex-wrap gap-2">
            {TIER_LINKS.map((tier) => (
              <ButtonLink key={tier} href={`/?hero-tier=${tier}`} variant="secondary" size="sm">
                ?hero-tier={tier}
              </ButtonLink>
            ))}
          </div>
        </DevPanel>

        <DevPanel title="Motion tokens (live)">
          <ul className="flex flex-col gap-3 text-body-sm">
            {DURATION_TOKENS.map((name) => (
              <li key={name} className="group">
                <div className="flex justify-between font-mono">
                  <span>--dur-{name}</span>
                  <span className="text-(--color-muted)">
                    {tokens ? `${Math.round(tokens.dur[name] * 1000)} ms` : '…'}
                  </span>
                </div>
                {/* Hover the row: the dot travels on this token's duration. */}
                <div className="mt-1 h-1 rounded-full bg-(--color-surface-raised)">
                  <div
                    className="size-1 rounded-full bg-(--color-accent) transition-transform ease-out-expo group-hover:translate-x-[calc(var(--container-xs)-0.25rem)]"
                    style={{ transitionDuration: `var(--dur-${name})` }}
                  />
                </div>
              </li>
            ))}
            <li className="flex justify-between font-mono">
              <span>--stagger · --motion-rise</span>
              <span className="text-(--color-muted)">
                {tokens ? `${Math.round(tokens.stagger * 1000)} ms · ${tokens.rise} px` : '…'}
              </span>
            </li>
          </ul>
        </DevPanel>
      </div>

      <DevPanel title="FocusText">
        <div className="flex flex-col gap-8">
          <div>
            <Text size="sm" tone="muted">
              loop
            </Text>
            <FocusText
              text="Augmented Virtual Mixed"
              className="mt-2 font-display text-display-md"
            />
          </div>
          <div>
            <Text size="sm" tone="muted">
              hover — point at a word
            </Text>
            <FocusText
              text="Build real things"
              mode="hover"
              className="mt-2 font-display text-display-md"
            />
          </div>
          <div>
            <Text size="sm" tone="muted">
              once — the hero&apos;s intro sweep
            </Text>
            <FocusText
              key={sweep}
              text="SIG Reality Spectra"
              mode="once"
              play={playing}
              onComplete={() => setPlaying(false)}
              className="mt-2 font-display text-display-md"
            />
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={() => {
                setSweep((n) => n + 1);
                setPlaying(true);
              }}
            >
              Play sweep
            </Button>
          </div>
        </div>
      </DevPanel>

      <DevPanel title="Magnetic">
        <Text size="sm" tone="muted">
          Bring a mouse pointer near the box (no effect for touch or under reduced motion).
        </Text>
        <div className="mt-6 flex justify-center py-6">
          <Magnetic>
            <span className="inline-flex size-24 items-center justify-center rounded-card border border-(--color-border-strong) bg-(--color-surface-raised) font-mono text-label text-(--color-muted) uppercase">
              Magnet
            </span>
          </Magnetic>
        </div>
      </DevPanel>

      <DevPanel title="SplitText (D-037)">
        <Text size="sm" tone="muted">
          play=&quot;load&quot; — pure CSS, the page titles. Remount to replay.
        </Text>
        <Heading key={rise} level={2} size="xl" className="mt-2">
          <SplitText text="Where ideas become experiences" highlight="experiences" play="load" />
        </Heading>
        <Button
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={() => setRise((n) => n + 1)}
        >
          Replay
        </Button>
      </DevPanel>

      <div className="grid gap-6 md:grid-cols-2">
        <DevPanel title="Spotlight (Card spotlight)">
          <Card spotlight featured>
            <CardBody className="p-8">
              <Text>Move a mouse over this card: a light follows it and runs along the rim.</Text>
            </CardBody>
          </Card>
        </DevPanel>
        <DevPanel title="Primary glare">
          <Text size="sm" tone="muted">
            Hover: a band of light sweeps across once, behind the label.
          </Text>
          <Button className="mt-6">Primary button</Button>
        </DevPanel>
      </div>

      <DevPanel title="Marquee (D-037)">
        <Marquee
          items={['Explore', 'Build', 'Express'].map((word) => (
            <span key={word} className="font-display text-display-lg text-outline">
              {word}
            </span>
          ))}
          separator={<span className="size-2 rotate-45 bg-(image:--gradient-spectra)" />}
        />
      </DevPanel>

      <div className="grid gap-6 md:grid-cols-2">
        <DevPanel title="DecodeText (D-038)">
          <DecodePlayground />
        </DevPanel>
        <DevPanel title="HudCorners + HoloFoil (D-038)">
          <div className="group/demo relative isolate aspect-video overflow-hidden rounded-card border border-(--color-border) bg-(--color-surface-raised)">
            <span className="absolute inset-0 bg-scanlines" />
            <HoloFoil />
            <HudCorners
              className="inset-3 scale-110 text-(--color-spectra-cyan) opacity-0 transition-[scale,opacity] duration-(--dur-medium) ease-out-expo group-hover/demo:scale-100 group-hover/demo:opacity-100"
              cornerClassName="size-4"
            />
            <span className="absolute inset-0 flex items-center justify-center font-mono text-label text-(--color-muted) uppercase">
              Hover me
            </span>
          </div>
        </DevPanel>
      </div>

      <div className="flex min-h-[80svh] items-center justify-center rounded-card border border-dashed border-(--color-border) text-(--color-muted)">
        Scroll down: Reveal, Stagger, ScrollWords and TimelineRail play as they enter the viewport.
      </div>

      <DevPanel title="ScrollWords (D-037)">
        <ScrollWords
          text="Each word brightens as the reader scrolls through it, tied to the scroll position rather than a clock, in opacity alone."
          className="font-display text-display-md text-(--color-text)"
        />
      </DevPanel>

      <DevPanel title="TimelineRail (D-037)">
        <div className="relative">
          <TimelineRail />
          <ol className="flex flex-col gap-16 ps-8">
            {['First', 'Second', 'Third'].map((label) => (
              <li key={label} className="relative">
                <TimelineMarker className="-start-[calc(2rem+0.3125rem)]" />
                <Text>{label} entry — its marker lights as it crosses 60% of the viewport.</Text>
              </li>
            ))}
          </ol>
        </div>
      </DevPanel>

      <DevPanel title="Parallax (D-038): drift, turn, portal">
        <div className="grid h-64 grid-cols-3 gap-4">
          {[{ depth: 1 }, { turn: 1 }, { portal: true }].map((props, index) => (
            <div
              key={index}
              className="relative flex items-center justify-center overflow-hidden rounded-card border border-(--color-border)"
            >
              <Parallax {...props} className="flex items-center justify-center">
                <span className="size-16 rounded-full border border-(--color-accent)" />
              </Parallax>
            </div>
          ))}
        </div>
      </DevPanel>

      <DevPanel title="ScrollFloat (D-038)">
        <ScrollFloat
          text="Reality Spectra"
          className="text-center font-display text-display-xl whitespace-nowrap text-(--color-text)"
        />
      </DevPanel>

      <Reveal>
        <DevPanel title="Reveal">
          <Text>
            This panel faded and rose by <code className="font-mono">--motion-rise</code> on{' '}
            <code className="font-mono">--dur-medium</code> with the out-expo ease — once. Reload
            and scroll again to replay. Content above the fold never animates, so nothing flashes.
          </Text>
        </DevPanel>
      </Reveal>

      <DevPanel title="Stagger">
        <Stagger as="ul" className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-4">
          {Array.from({ length: 9 }, (_, i) => (
            <li
              key={i}
              className="aspect-4/3 rounded-control border border-(--color-border) bg-(--color-surface-raised) p-4 font-mono text-label text-(--color-muted)"
            >
              item {i + 1}
            </li>
          ))}
        </Stagger>
      </DevPanel>
    </div>
  );
}

/** DecodeText on demand: each press decodes the label again. */
function DecodePlayground() {
  const [replay, setReplay] = useState(0);
  return (
    <div className="flex flex-col items-start gap-4">
      <p className="font-mono text-label text-(--color-text) uppercase">
        <DecodeText text="Signal acquired · 01 / 06" trigger="manual" replay={replay} />
      </p>
      <Button size="sm" variant="secondary" onClick={() => setReplay((count) => count + 1)}>
        Decode again
      </Button>
    </div>
  );
}
