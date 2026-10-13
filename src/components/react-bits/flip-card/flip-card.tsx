'use client';

import { useState, type ReactNode } from 'react';

import { useReducedMotion } from '@/components/motion/use-reduced-motion';
import { cn } from '@/lib/cn';

type FlipCardProps = {
  front: ReactNode;
  back: ReactNode;
  label: string;
  className?: string;
  flipped?: boolean;
  onFlip?: (flipped: boolean) => void;
};

/** React Bits Flip Card adapted to the site's tokens, semantics and motion rules. */
export function FlipCard({
  front,
  back,
  label,
  className,
  flipped: controlledFlipped,
  onFlip,
}: FlipCardProps) {
  const reducedMotion = useReducedMotion();
  const [uncontrolledFlipped, setUncontrolledFlipped] = useState(false);
  const isFlipped = controlledFlipped ?? uncontrolledFlipped;

  function toggle() {
    const next = !isFlipped;
    if (controlledFlipped === undefined) setUncontrolledFlipped(next);
    onFlip?.(next);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${isFlipped ? 'Hide' : 'Reveal'} details for ${label}`}
      aria-pressed={isFlipped}
      className={cn(
        'group block w-full [perspective:80rem] text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--color-accent)',
        className,
      )}
      onClick={toggle}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggle();
        }
      }}
    >
      <span
        className={cn(
          'relative block aspect-4/5 w-full [transform-style:preserve-3d]',
          reducedMotion
            ? ''
            : 'transition-transform duration-(--dur-medium) ease-in-out',
          isFlipped ? '[transform:rotateY(180deg)]' : '[transform:rotateY(0deg)]',
        )}
      >
        <span
          aria-hidden={isFlipped}
          className="absolute inset-0 overflow-hidden rounded-card [backface-visibility:hidden]"
        >
          {front}
        </span>
        <span
          aria-hidden={!isFlipped}
          className="absolute inset-0 overflow-hidden rounded-card [backface-visibility:hidden] [transform:rotateY(180deg)]"
        >
          {back}
        </span>
      </span>
    </div>
  );
}
