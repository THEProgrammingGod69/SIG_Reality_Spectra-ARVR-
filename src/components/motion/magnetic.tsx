'use client';

import { useEffect, useRef, type ReactNode } from 'react';

import { cn } from '@/lib/cn';

import { prefersReducedMotion, useReducedMotion } from './use-reduced-motion';

type MagneticProps = {
  children: ReactNode;
  className?: string;
  /** How far beyond its edges the element starts to pull, in rem (board: 40px). */
  reachRem?: number;
  /** Fraction of the pointer's offset the element follows. */
  strength?: number;
};

/**
 * Magnetic — our version of React Bits' Magnet.
 *
 * The child drifts toward a nearby pointer and settles back when it leaves.
 * Unlike Magnet it never re-renders on mouse move: the transform is written
 * directly, once per animation frame, and eased by a CSS transition on the
 * `--dur-short` token. Only `transform` changes (rule 4).
 *
 * Off for touch and pen (no hover to attract), and under reduced motion.
 */
export function Magnetic({ children, className, reachRem = 2.5, strength = 0.3 }: MagneticProps) {
  const outerRef = useRef<HTMLSpanElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner || reducedMotion || prefersReducedMotion()) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const reach =
      reachRem * (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16);
    let frame = 0;
    let pointer: { x: number; y: number } | null = null;

    const apply = () => {
      frame = 0;
      if (!pointer) return;
      const rect = outer.getBoundingClientRect();
      const dx = pointer.x - (rect.left + rect.width / 2);
      const dy = pointer.y - (rect.top + rect.height / 2);
      const near = Math.abs(dx) < rect.width / 2 + reach && Math.abs(dy) < rect.height / 2 + reach;
      inner.style.transform = near ? `translate3d(${dx * strength}px, ${dy * strength}px, 0)` : '';
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      pointer = { x: event.clientX, y: event.clientY };
      frame ||= requestAnimationFrame(apply);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(frame);
      inner.style.transform = '';
    };
  }, [reachRem, strength, reducedMotion]);

  return (
    <span ref={outerRef} className={cn('relative inline-flex', className)}>
      <span
        ref={innerRef}
        className="inline-flex transition-transform duration-(--dur-short) ease-out-expo"
      >
        {children}
      </span>
    </span>
  );
}
