'use client';

import type { CSSProperties } from 'react';

type LatticeLoaderProps = {
  label?: string;
};

const pattern = [0, 1, 2, 1, null, 3, 2, 3, 4];

/** React Bits Lattice Loader baseline, retokenized for the public site. */
export function LatticeLoader({ label = 'Preparing event' }: LatticeLoaderProps) {
  return (
    <div role="status" aria-label={label} className="inline-flex items-center gap-3 font-mono text-label text-(--color-silver) uppercase">
      <span aria-hidden="true" className="grid grid-cols-3 gap-1">
        {pattern.map((step, index) => (
          <span
            key={`${step ?? 'empty'}-${index}`}
            className="size-2 rounded-full bg-(--color-accent) opacity-20 animate-lattice-wave"
            style={{ animationDelay: `calc(var(--stagger) * ${step ?? 0})` } as CSSProperties}
          />
        ))}
      </span>
      <span>{label}</span>
    </div>
  );
}
