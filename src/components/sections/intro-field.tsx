'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

import type { FieldInput } from '@/components/three/spectral-field/spectral-field-scene';
import { useHeroTier } from '@/components/three/use-hero-tier';
import { cn } from '@/lib/cn';

/**
 * The three.js chunk, shared with the hero's: loaded only for the high device
 * tier, and never on the server.
 */
const SpectralFieldScene = dynamic(
  () => import('@/components/three/spectral-field/spectral-field-scene'),
  { ssr: false, loading: () => null },
);

/** Energy a full-screen sweep of the pointer, or a screen of scrolling, puts in. */
const POINTER_ENERGY = 0.6;
const SCROLL_ENERGY = 0.5;

/**
 * Light through the lab's haze behind an inner page's opening (D-038): the
 * Spectral Field shader, under the backdrop's grid and orbit. It answers the
 * visitor — the light leans toward the pointer, and the rays turn while the
 * pointer moves or the page scrolls — and is still otherwise.
 *
 * High device tier only (`useHeroTier`): reduced motion, software WebGL,
 * phones and weaker devices keep the static lab (`LabBackdrop`), which is
 * always drawn beneath. The canvas fades in once its first frame is ready and
 * stops drawing whenever the intro is off screen. Decorative: `aria-hidden`,
 * no pointer events.
 */
export function IntroField() {
  const decision = useHeroTier();
  const enabled = decision?.tier === 'high';
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<FieldInput>({ pointer: null, energy: 0, startedAt: 0 });
  const [onScreen, setOnScreen] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !enabled) return;
    const observer = new IntersectionObserver(([entry]) =>
      setOnScreen(entry?.isIntersecting ?? true),
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, [enabled]);

  // The field's settle is counted from here, however long its chunk takes.
  useEffect(() => {
    inputRef.current.startedAt = performance.now();
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const input = inputRef.current;
    let lastScroll = window.scrollY;

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      const next = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: 1 - (event.clientY / window.innerHeight) * 2,
      };
      if (input.pointer) {
        const travel = Math.hypot(next.x - input.pointer.x, next.y - input.pointer.y) / 2;
        input.energy += travel * POINTER_ENERGY;
      }
      input.pointer = next;
    };
    const onLeave = (event: PointerEvent) => {
      if (event.relatedTarget === null) input.pointer = null;
    };
    const onScroll = () => {
      const scrolled = Math.abs(window.scrollY - lastScroll) / Math.max(window.innerHeight, 1);
      lastScroll = window.scrollY;
      input.energy += scrolled * SCROLL_ENERGY;
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerout', onLeave, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerout', onLeave);
      window.removeEventListener('scroll', onScroll);
    };
  }, [enabled]);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      data-intro-field={enabled ? 'on' : 'off'}
      className={cn(
        'pointer-events-none absolute inset-0 -z-10 mask-b-from-50% mask-b-to-100% transition-opacity duration-(--dur-long) ease-out-expo',
        ready ? 'opacity-100' : 'opacity-0',
      )}
    >
      {enabled ? (
        <SpectralFieldScene active={onScreen} input={inputRef} onReady={() => setReady(true)} />
      ) : null}
    </div>
  );
}
