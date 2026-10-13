'use client';

import { useEffect, useRef, useState } from 'react';

import { prefersReducedMotion, useReducedMotion } from '@/components/motion/use-reduced-motion';
import { cn } from '@/lib/cn';

const FLAP_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

type SplitFlapTextProps = {
  text: string;
  className?: string;
  start?: boolean;
};

/**
 * React Bits Split Flap Text, adapted to the site's motion and design tokens.
 * Each plate settles with transform/opacity only and remains readable as text.
 */
export function SplitFlapText({ text, className, start = false }: SplitFlapTextProps) {
  const reducedMotion = useReducedMotion();
  const [revealed, setRevealed] = useState(false);
  const [flapText, setFlapText] = useState(text);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!start || reducedMotion || prefersReducedMotion()) return;

    let step = 0;
    const totalSteps = Math.max(8, text.length + 4);

    intervalRef.current = setInterval(() => {
      step += 1;
      if (step >= totalSteps) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        setFlapText(text);
        setRevealed(true);
        return;
      }

      setFlapText(
        text
          .split('')
          .map((character, index) => {
            if (character === ' ' || index < step - 2) return character;
            return FLAP_CHARACTERS[(index * 11 + step * 7) % FLAP_CHARACTERS.length];
          })
          .join(''),
      );
    }, 70);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [reducedMotion, start, text]);

  return (
    <span
      aria-label={text}
      className={cn('inline-flex flex-wrap', className)}
      data-split-flap-state={!start || reducedMotion || revealed ? 'complete' : 'animating'}
    >
      {(reducedMotion ? text : flapText).split('').map((character, index) => (
        <span
          aria-hidden="true"
          className={cn(
            'inline-block min-w-[0.62em] origin-center transition-[transform,opacity] duration-(--dur-short) ease-out-expo',
            !start || reducedMotion || revealed
              ? 'translate-y-0 opacity-100'
              : 'translate-y-(--motion-rise) opacity-70',
          )}
          key={`${index}-${character}`}
        >
          {character === ' ' ? '\u00a0' : character}
        </span>
      ))}
    </span>
  );
}
