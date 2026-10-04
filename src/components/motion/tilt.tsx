'use client';

import { useEffect, useRef, type ReactNode } from 'react';

import { cn } from '@/lib/cn';

import { prefersReducedMotion, useReducedMotion } from './use-reduced-motion';

type TiltProps = {
  children: ReactNode;
  className?: string;
  /** The largest lean toward the pointer, in degrees. Subtle: a lab, not a game. */
  maxDegrees?: number;
  /** How deep the 3D space is, in rem; smaller is more dramatic. */
  perspectiveRem?: number;
};

/**
 * Tilt — our version of React Bits' TiltedCard, on the same rules as
 * `Magnetic` (Stage 9, D-033).
 *
 * The card leans a few degrees toward the mouse while it is over it and
 * settles back when it leaves. It never re-renders on mouse move: the
 * transform is written directly, once per animation frame, and eased by a CSS
 * transition on the `--dur-short` token. Only `transform` changes (rule 4).
 *
 * Off for touch and pen, and under reduced motion: the card is just a card.
 */
export function Tilt({ children, className, maxDegrees = 4, perspectiveRem = 60 }: TiltProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const element = ref.current;
    if (!element || reducedMotion || prefersReducedMotion()) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    let frame = 0;
    let pointer: { x: number; y: number } | null = null;

    const apply = () => {
      frame = 0;
      if (!pointer) {
        element.style.transform = '';
        return;
      }
      const rect = element.getBoundingClientRect();
      // -0.5 … 0.5 across the card, from its centre.
      const x = (pointer.x - rect.left) / rect.width - 0.5;
      const y = (pointer.y - rect.top) / rect.height - 0.5;
      element.style.transform = `perspective(${perspectiveRem}rem) rotateX(${-y * 2 * maxDegrees}deg) rotateY(${x * 2 * maxDegrees}deg)`;
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

    element.addEventListener('pointermove', onMove, { passive: true });
    element.addEventListener('pointerleave', onLeave);
    return () => {
      element.removeEventListener('pointermove', onMove);
      element.removeEventListener('pointerleave', onLeave);
      cancelAnimationFrame(frame);
      element.style.transform = '';
    };
  }, [maxDegrees, perspectiveRem, reducedMotion]);

  return (
    <div
      ref={ref}
      className={cn('h-full transition-transform duration-(--dur-short) ease-out-expo', className)}
    >
      {children}
    </div>
  );
}
