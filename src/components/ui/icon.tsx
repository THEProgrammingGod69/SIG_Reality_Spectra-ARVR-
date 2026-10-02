import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/cn';

const sizes = {
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-6',
} as const;

export type IconSize = keyof typeof sizes;

type IconProps = {
  icon: LucideIcon;
  size?: IconSize;
  /** Give a meaningful icon an accessible name; omit it for decorative icons. */
  label?: string;
  className?: string;
};

/**
 * Lucide icon at a design-system size with the house 1.5 stroke. Decorative
 * by default (hidden from assistive technology); pass `label` when the icon
 * carries meaning on its own. Colour follows `currentColor`.
 */
export function Icon({ icon: Glyph, size = 'md', label, className }: IconProps) {
  return (
    <Glyph
      strokeWidth={1.5}
      className={cn('shrink-0', sizes[size], className)}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
      focusable={false}
    />
  );
}
