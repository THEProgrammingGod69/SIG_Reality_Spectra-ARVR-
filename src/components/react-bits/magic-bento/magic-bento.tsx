'use client';

import { useEffect, useRef, type HTMLAttributes, type ReactNode } from 'react';

import { prefersReducedMotion, useReducedMotion } from '@/components/motion/use-reduced-motion';
import { cn } from '@/lib/cn';

type MagicBentoProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
};

/**
 * React Bits Magic Bento, reduced to one calm content card for the public site.
 * The pointer accent follows the cursor through transform/opacity only.
 */
export function MagicBento({ children, className, ...rest }: MagicBentoProps) {
  const Tag = 'article';
  const cardRef = useRef<HTMLElement>(null);
  const accentRef = useRef<HTMLSpanElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const card = cardRef.current;
    const accent = accentRef.current;
    if (!card || !accent || reducedMotion || prefersReducedMotion()) return;

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      accent.style.transform = `translate(${x}px, ${y}px)`;
      accent.style.opacity = '0.16';
    };
    const onPointerLeave = () => {
      accent.style.transform = 'translate(0, 0)';
      accent.style.opacity = '0';
    };

    card.addEventListener('pointermove', onPointerMove);
    card.addEventListener('pointerleave', onPointerLeave);
    return () => {
      card.removeEventListener('pointermove', onPointerMove);
      card.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [reducedMotion]);

  return (
    <Tag
      ref={(node) => {
        cardRef.current = node;
      }}
      className={cn(
        'relative isolate overflow-hidden rounded-card border border-(--color-border) bg-(--color-surface) shadow-card transition-transform duration-(--dur-short) ease-out-expo hover:-translate-y-1 focus-within:-translate-y-1',
        className,
      )}
      {...rest}
    >
      <span
        ref={accentRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[min(18rem,80%)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-(--color-accent) opacity-0 blur-3xl transition-[opacity,transform] duration-(--dur-short) ease-out-expo"
      />
      {children}
    </Tag>
  );
}
