'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

import { prefersReducedMotion } from '@/components/motion/use-reduced-motion';
import { createHeroSceneState } from '@/components/three/orbit-lab/scene-state';
import { Button } from '@/components/ui/button';
import { useHeroTier } from '@/components/three/use-hero-tier';
import { gsap, gsapEase, ScrollTrigger } from '@/lib/motion/gsap';
import { readMotionTokens } from '@/lib/motion/tokens';

import { HeroIntroContext, type HeroIntroPhase } from './hero-intro-context';

/**
 * The three.js chunk. Loaded only when the device tier asks for a canvas, and
 * never on the server: the first paint is always the static still.
 */
const OrbitLabScene = dynamic(() => import('@/components/three/orbit-lab/orbit-lab-scene'), {
  ssr: false,
  loading: () => null,
});

/** The intro plays once per browser session. */
const INTRO_SEEN_KEY = 'sig:hero-intro-seen';

/**
 * If the canvas is not ready this long after the page mounted (slow network,
 * slow device), skip the intro and show the scene at rest: the intro must
 * never keep the hero busy after the content has long been readable.
 */
const INTRO_LATE_START_MS = 2500;

/** Scroll-out: the hero stays pinned for 150% of the viewport height. */
const PIN_LENGTH = '+=150%';

/** How visible the scene stays when the pin releases and the page takes over. */
const HANDOVER_OPACITY = 0.35;

function hasSeenIntro(): boolean {
  try {
    return window.sessionStorage.getItem(INTRO_SEEN_KEY) === '1';
  } catch {
    // Storage blocked (privacy mode): treat as seen, never replay on every visit.
    return true;
  }
}

function markIntroSeen() {
  try {
    window.sessionStorage.setItem(INTRO_SEEN_KEY, '1');
  } catch {
    // Nothing to do; the intro simply will not be remembered.
  }
}

type HeroStageProps = {
  /** The hero text — server-rendered, readable before any script runs. */
  children: ReactNode;
  /** The designed still (hero-still.tsx). */
  still: ReactNode;
  /** id of the <h1>, which names the section. */
  labelledBy: string;
};

/**
 * Runs the hero: picks the device tier, lazy-loads the scene, plays the
 * once-per-session intro, pins the scroll-out, pauses the canvas off screen
 * and tracks the pointer for the high-tier tilt.
 *
 * Every tier renders the same layout. The static tier (reduced motion, no
 * WebGL 2) simply never mounts a canvas, so the still stays.
 */
export function HeroStage({ children, still, labelledBy }: HeroStageProps) {
  const decision = useHeroTier();
  const tier = decision?.tier ?? null;
  const is3D = tier === 'low' || tier === 'high';

  const sectionRef = useRef<HTMLElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(createHeroSceneState());
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const mountedAtRef = useRef(0);

  const [ready, setReady] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const [phase, setPhase] = useState<HeroIntroPhase>('idle');

  useEffect(() => {
    mountedAtRef.current = performance.now();
    return () => {
      timelineRef.current?.kill();
    };
  }, []);

  /** First frame rendered: reveal the canvas and play (or skip) the intro. */
  const handleSceneReady = useCallback(() => {
    setReady(true);
    if (timelineRef.current) return;

    const state = stateRef.current;
    const late = performance.now() - mountedAtRef.current > INTRO_LATE_START_MS;
    const seen = hasSeenIntro();
    // The session's one chance at the intro is now, whether it plays or is
    // skipped for being late: it never turns up on a later page view.
    markIntroSeen();

    if (prefersReducedMotion() || late || seen) {
      Object.assign(state, createHeroSceneState(true), { scroll: state.scroll });
      setPhase('done');
      return;
    }

    const tokens = readMotionTokens();
    const outExpo = gsapEase(tokens, 'outExpo');
    const inOut = gsapEase(tokens, 'inOut');
    const { micro, medium } = tokens.dur;

    // Technical Plan, "Hero choreography": darkness → the headset outline draws
    // in → particles converge, the ring ignites left to right and the horizon
    // fades up. Ends at micro + medium + medium ≈ 1.35 s, inside the 1.5 s budget.
    timelineRef.current = gsap
      .timeline({ onComplete: () => setPhase('done') })
      .to(state, { draw: 1, duration: medium + micro, ease: inOut }, micro)
      .to(state, { converge: 1, duration: medium, ease: outExpo }, medium)
      .to(state, { ignite: 1, duration: medium, ease: inOut }, medium + micro)
      .to(state, { horizon: 1, duration: medium, ease: outExpo }, medium + micro);

    setPhase('playing');
  }, []);

  const skipIntro = useCallback(() => {
    timelineRef.current?.progress(1);
  }, []);

  // Escape skips the intro too.
  useEffect(() => {
    if (phase !== 'playing') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') skipIntro();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, skipIntro]);

  // Render only while the hero is on screen.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !is3D) return;

    const observer = new IntersectionObserver(([entry]) =>
      setOnScreen(entry?.isIntersecting ?? true),
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, [is3D]);

  // Pointer tilt, high tier only.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || tier !== 'high') return;

    const state = stateRef.current;
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      const rect = section.getBoundingClientRect();
      state.pointerX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      state.pointerY = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    };
    const onLeave = () => {
      state.pointerX = 0;
      state.pointerY = 0;
    };

    section.addEventListener('pointermove', onMove);
    section.addEventListener('pointerleave', onLeave);
    return () => {
      section.removeEventListener('pointermove', onMove);
      section.removeEventListener('pointerleave', onLeave);
      onLeave();
    };
  }, [tier]);

  // Scroll-out, 3D tiers only: pinned for 150vh, the camera pushes through the
  // lens, the rings open around the viewer and the hero hands over to the page.
  useLayoutEffect(() => {
    const section = sectionRef.current;
    const visual = visualRef.current;
    const content = contentRef.current;
    if (!section || !visual || !content || !is3D || prefersReducedMotion()) return;

    const state = stateRef.current;
    const tokens = readMotionTokens();

    const context = gsap.context(() => {
      gsap
        .timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: PIN_LENGTH,
            pin: true,
            scrub: true,
            // The pin is created after the tier is known — after every other
            // trigger on the page — yet its spacing moves all of them. A higher
            // priority makes every refresh measure it first, so the triggers
            // below the hero are measured with the spacing in place (D-037).
            refreshPriority: 1,
          },
        })
        .to(state, { scroll: 1, duration: 1 }, 0)
        .to(content, { opacity: 0, y: -tokens.rise * 2, scale: 0.96, duration: 0.45 }, 0)
        // Dim, not vanish: when the pin releases, the hero scrolls away as a
        // quiet backdrop instead of leaving a viewport of empty black.
        .to(visual, { opacity: HANDOVER_OPACITY, duration: 0.4 }, 0.6);
    }, section);

    // The pin adds spacing below the hero; re-measure every other trigger.
    ScrollTrigger.refresh();

    return () => {
      context.revert();
      state.scroll = 0;
      ScrollTrigger.refresh();
    };
  }, [is3D]);

  const stillHidden = is3D && ready;

  return (
    <HeroIntroContext value={phase}>
      <section
        ref={sectionRef}
        aria-labelledby={labelledBy}
        data-hero-tier={tier ?? 'pending'}
        data-hero-intro={phase}
        // Runs underneath the fixed header (see the site layout's <main>).
        data-full-bleed
        className="relative isolate flex min-h-svh overflow-hidden"
      >
        {/* The mask fades the scene into the page at the hero's bottom edge. */}
        <div
          ref={visualRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 mask-b-from-85% mask-b-to-100%"
        >
          <div
            data-testid="hero-still"
            className={`absolute inset-0 transition-opacity duration-(--dur-medium) ease-out-expo ${stillHidden ? 'opacity-0' : 'opacity-100'}`}
          >
            {still}
          </div>

          {is3D ? (
            <div
              data-testid="hero-canvas"
              className={`absolute inset-0 transition-opacity duration-(--dur-medium) ease-out-expo ${ready ? 'opacity-100' : 'opacity-0'}`}
            >
              <OrbitLabScene
                tier={tier}
                stateRef={stateRef}
                active={onScreen}
                onReady={handleSceneReady}
              />
            </div>
          ) : null}
        </div>

        <div ref={contentRef} className="flex w-full">
          {children}
        </div>

        {is3D && phase === 'playing' ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={skipIntro}
            className="absolute right-gutter bottom-6 bg-(--color-glass) font-mono text-label uppercase"
          >
            Skip intro <span aria-hidden="true">· Esc</span>
          </Button>
        ) : null}
      </section>
    </HeroIntroContext>
  );
}
