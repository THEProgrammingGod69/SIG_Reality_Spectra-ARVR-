'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';

import { enterOnScroll } from './enter-on-scroll';
import { prefersReducedMotion, useReducedMotion } from './use-reduced-motion';

type StaggerProps = {
  /** Each direct child enters in turn, `--stagger` apart. */
  children: ReactNode;
  className?: string;
  /** Render as a list when the children are `<li>`s. */
  as?: 'div' | 'ul' | 'ol';
};

/**
 * Brings its direct children in one after another when the group scrolls into
 * view — for lists, grids and card rows. Same rules as `<Reveal>`: opacity and
 * transform only, nothing hidden ahead of time, and a static render under
 * reduced motion.
 */
export function Stagger({ children, className, as: Tag = 'div' }: StaggerProps) {
  const ref = useRef<HTMLDivElement & HTMLUListElement & HTMLOListElement>(null);
  const reducedMotion = useReducedMotion();

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || reducedMotion || prefersReducedMotion()) return;

    const items = Array.from(element.children);
    if (items.length === 0) return;

    return enterOnScroll(element, items);
  }, [reducedMotion]);

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
