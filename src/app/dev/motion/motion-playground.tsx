'use client';

import Link from 'next/link';
import { useState, useSyncExternalStore, type ReactNode } from 'react';

import { FocusText } from '@/components/motion/focus-text';
import { Reveal } from '@/components/motion/reveal';
import { Stagger } from '@/components/motion/stagger';
import { useReducedMotion } from '@/components/motion/use-reduced-motion';
import { useHeroTier } from '@/components/three/use-hero-tier';
import { readHeroTierSignals, type HeroTier } from '@/lib/motion/hero-tier';
import { DURATION_TOKENS, readMotionTokens } from '@/lib/motion/tokens';

const TIER_LINKS: readonly HeroTier[] = ['high', 'low', 'static'];

/* Live token values, re-read whenever "reduce motion" changes. */
let tokenSnapshot: string | null = null;
function subscribeTokens(onChange: () => void) {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const handle = () => {
    tokenSnapshot = null;
    onChange();
  };
  media.addEventListener('change', handle);
  return () => media.removeEventListener('change', handle);
}
function getTokens() {
  tokenSnapshot ??= JSON.stringify(readMotionTokens());
  return tokenSnapshot;
}

let signalSnapshot: string | null = null;
function getSignals() {
  signalSnapshot ??= JSON.stringify(readHeroTierSignals(), null, 2);
  return signalSnapshot;
}
const noSubscribe = () => () => {};

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-6">
      <h2 className="font-mono text-xs tracking-widest text-(--color-muted) uppercase">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Button({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-(--color-border-strong) px-4 py-1.5 text-sm transition-colors duration-(--dur-micro) hover:border-(--color-accent)"
    >
      {children}
    </button>
  );
}

export function MotionPlayground() {
  const reducedMotion = useReducedMotion();
  const decision = useHeroTier();
  const tokensJson = useSyncExternalStore(subscribeTokens, getTokens, () => null);
  const signalsJson = useSyncExternalStore(noSubscribe, getSignals, () => null);
  const tokens = tokensJson
    ? (JSON.parse(tokensJson) as ReturnType<typeof readMotionTokens>)
    : null;

  const [sweep, setSweep] = useState(0);
  const [playing, setPlaying] = useState(false);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-6 py-16">
      <header>
        <p className="font-mono text-xs tracking-widest text-(--color-muted) uppercase">
          Development only · 404 in production
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Motion playground</h1>
        <p className="mt-3 max-w-2xl text-(--color-muted)">
          Every Stage 2 primitive in isolation. Toggle your operating system&apos;s “reduce motion”
          setting to watch each one fall back to a static render.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Panel title="Environment">
          <dl className="space-y-2 text-sm">
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
          <pre className="mt-4 overflow-x-auto rounded-lg bg-(--color-bg) p-3 font-mono text-xs text-(--color-muted)">
            {signalsJson ?? '…'}
          </pre>
          <p className="mt-4 text-sm text-(--color-muted)">Open the hero in a forced tier:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {TIER_LINKS.map((tier) => (
              <Link
                key={tier}
                href={`/?hero-tier=${tier}`}
                className="rounded-full border border-(--color-border-strong) px-4 py-1.5 font-mono text-xs hover:border-(--color-accent)"
              >
                ?hero-tier={tier}
              </Link>
            ))}
          </div>
        </Panel>

        <Panel title="Motion tokens (live)">
          <ul className="space-y-3 text-sm">
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
        </Panel>
      </div>

      <Panel title="FocusText">
        <div className="space-y-8">
          <div>
            <p className="text-sm text-(--color-muted)">loop</p>
            <FocusText text="Augmented Virtual Mixed" className="mt-2 text-3xl font-semibold" />
          </div>
          <div>
            <p className="text-sm text-(--color-muted)">hover — point at a word</p>
            <FocusText
              text="Build real things"
              mode="hover"
              className="mt-2 text-3xl font-semibold"
            />
          </div>
          <div>
            <p className="text-sm text-(--color-muted)">once — the hero&apos;s intro sweep</p>
            <FocusText
              key={sweep}
              text="SIG Reality Spectra"
              mode="once"
              play={playing}
              onComplete={() => setPlaying(false)}
              className="mt-2 text-3xl font-semibold"
            />
            <div className="mt-4">
              <Button
                onClick={() => {
                  setSweep((n) => n + 1);
                  setPlaying(true);
                }}
              >
                Play sweep
              </Button>
            </div>
          </div>
        </div>
      </Panel>

      <div className="flex min-h-[80svh] items-center justify-center rounded-2xl border border-dashed border-(--color-border) text-(--color-muted)">
        Scroll down: Reveal and Stagger play as they enter the viewport.
      </div>

      <Reveal>
        <Panel title="Reveal">
          <p className="text-(--color-text-body)">
            This panel faded and rose by <code className="font-mono">--motion-rise</code> on{' '}
            <code className="font-mono">--dur-medium</code> with the out-expo ease — once. Reload
            and scroll again to replay. Content above the fold never animates, so nothing flashes.
          </p>
        </Panel>
      </Reveal>

      <Panel title="Stagger">
        <Stagger as="ul" className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-4">
          {Array.from({ length: 9 }, (_, i) => (
            <li
              key={i}
              className="aspect-4/3 rounded-xl border border-(--color-border) bg-(--color-surface-raised) p-4 font-mono text-xs text-(--color-muted)"
            >
              item {i + 1}
            </li>
          ))}
        </Stagger>
      </Panel>
    </div>
  );
}
