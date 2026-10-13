'use client';

import { useEffect, useRef } from 'react';

import { prefersReducedMotion, useReducedMotion } from './use-reduced-motion';

/**
 * Spotlight — our version of React Bits' SpotlightCard (D-037).
 *
 * A soft accent light follows the mouse across its parent (a card), and a
 * brighter, smaller one runs along the parent's edge as a rim. SpotlightCard
 * repaints a `radial-gradient` background on every pointer move; here each
 * light is a fixed-size element moved with `transform`, and the hover fades
 * it in and out with `opacity` (rule 4). No re-render per move: the position
 * is written once per animation frame.
 *
 * Drop it in as the first child of a positioned element that is its own
 * stacking context (`relative isolate`): it sits behind the content and above
 * the parent's background. `Card` does this for you with `spotlight`.
 *
 * Mouse only, and off under reduced motion: on touch screens and for those
 * visitors it renders nothing visible.
 */
export function Spotlight({ rim = true }: { rim?: boolean }) {
  const layerRef = useRef<HTMLSpanElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const layer = layerRef.current;
    const host = layer?.parentElement;
    if (!layer || !host || reducedMotion || prefersReducedMotion()) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const lights = Array.from(layer.querySelectorAll<HTMLElement>('[data-light]'));
    let frame = 0;
    let pointer: { x: number; y: number } | null = null;

    const apply = () => {
      frame = 0;
      if (!pointer) {
        delete layer.dataset.active;
        return;
      }
      const rect = host.getBoundingClientRect();
      const x = pointer.x - rect.left;
      const y = pointer.y - rect.top;
      for (const light of lights) {
        light.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      }
      layer.dataset.active = 'true';
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
      delete layer.dataset.active;
    };
  }, [reducedMotion]);

  return (
    <span
      ref={layerRef}
      aria-hidden="true"
      className="group/spotlight pointer-events-none absolute inset-0 -z-10 rounded-[inherit] opacity-0 transition-opacity duration-(--dur-medium) ease-out-expo data-active:opacity-100"
    >
      <span className="absolute inset-0 overflow-hidden rounded-[inherit]">
        <span
          data-light
          className="absolute top-0 left-0 size-(--spotlight-size) rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--color-accent)_14%,transparent),transparent)] will-change-transform"
        />
      </span>
      {rim ? (
        <span className="absolute inset-0 overflow-hidden rounded-[inherit] mask-rim">
          <span
            data-light
            className="absolute top-0 left-0 size-[calc(var(--spotlight-size)*0.6)] rounded-full bg-[radial-gradient(closest-side,var(--color-spectra-orchid),color-mix(in_oklab,var(--color-spectra-azure)_60%,transparent)_45%,transparent)] will-change-transform"
          />
        </span>
      ) : null}
    </span>
  );
}
