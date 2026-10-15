'use client';

import { useEffect, useRef } from 'react';

import { prefersReducedMotion, useReducedMotion } from './use-reduced-motion';

/** How far the foil's band travels across its host, as a share of the band's width. */
const TRAVEL_PERCENT = 22;

/**
 * Holographic foil (D-038) — the sheen on a lab access pass, after React
 * Bits' ProfileCard. A diagonal band of spectrum light (`bg-holo`) lies over
 * the host and slides across it with the pointer, as foil catches the light
 * when a pass is tilted; it fades in on hover and out on leave.
 *
 * ProfileCard moves its gradients by rewriting `background-position` and a
 * dozen CSS variables per move; here the band is one oversized layer moved
 * with `transform` and faded with `opacity` (rule 4), written once per
 * animation frame. Drop it in as a child of a positioned, clipped element (a
 * card's media). Mouse only; nothing under reduced motion. Decorative.
 */
export function HoloFoil() {
  const ref = useRef<HTMLSpanElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const band = ref.current;
    const host = band?.parentElement;
    if (!band || !host || reducedMotion || prefersReducedMotion()) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    let frame = 0;
    let pointer: { x: number; y: number } | null = null;
    const apply = () => {
      frame = 0;
      if (!pointer) {
        delete band.dataset.active;
        return;
      }
      const rect = host.getBoundingClientRect();
      // -1 … 1 across the host, from its centre.
      const x = ((pointer.x - rect.left) / rect.width) * 2 - 1;
      const y = ((pointer.y - rect.top) / rect.height) * 2 - 1;
      band.style.transform = `translate3d(${x * TRAVEL_PERCENT}%, ${y * TRAVEL_PERCENT * 0.5}%, 0)`;
      band.dataset.active = 'true';
    };
    const schedule = () => {
      frame ||= requestAnimationFrame(apply);
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      pointer = { x: event.clientX, y: event.clientY };
      schedule();
    };
    const onLeave = () => {
      pointer = null;
      schedule();
    };

    host.addEventListener('pointermove', onMove, { passive: true });
    host.addEventListener('pointerleave', onLeave);
    return () => {
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
      cancelAnimationFrame(frame);
    };
  }, [reducedMotion]);

  return (
    <span
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute -inset-1/2 bg-holo opacity-0 mix-blend-screen transition-opacity duration-(--dur-medium) ease-out-expo data-active:opacity-100"
    />
  );
}
