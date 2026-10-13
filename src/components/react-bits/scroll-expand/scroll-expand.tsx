'use client';

import type { CSSProperties, ReactNode } from 'react';

import { cn } from '@/lib/cn';

type ScrollExpandProps = {
  progress: number;
  reducedMotion?: boolean;
  children: ReactNode;
  className?: string;
};

const clamp = (value: number) => Math.min(1, Math.max(0.01, value));
const smoothstep = (value: number) => value * value * (3 - 2 * value);

/** React Bits Scroll Expand baseline, driven by the section's shared progress. */
export function ScrollExpand({ progress, reducedMotion = false, children, className }: ScrollExpandProps) {
  const eased = smoothstep(clamp(progress));
  const scale = reducedMotion ? 1 : 0.46 + eased * 0.54;

  return (
    <div className="sticky top-0 flex min-h-svh items-center justify-center overflow-hidden">
      <div
        className={cn(
          'relative h-[min(70svh,42rem)] w-full max-w-content overflow-hidden rounded-card bg-(--color-surface) shadow-card [transform-origin:center] [will-change:transform]',
          className,
        )}
        style={{ transform: `scale(${scale})` } as CSSProperties}
      >
        {children}
      </div>
    </div>
  );
}
