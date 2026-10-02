'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';

import { enterOnScroll } from './enter-on-scroll';
import { prefersReducedMotion, useReducedMotion } from './use-reduced-motion';

type RevealProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Fades and lifts its content into place the first time it scrolls into view.
 *
 * Animates `opacity` and `transform` only, on the medium duration and the
 * out-expo ease. Under reduced motion, without JavaScript, or when the content
 * is already on screen at load, it renders the content as-is.
 */
export function Reveal({ children, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || reducedMotion || prefersReducedMotion()) return;

    return enterOnScroll(element, element);
  }, [reducedMotion]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
