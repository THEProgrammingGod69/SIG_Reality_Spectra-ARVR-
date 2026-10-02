import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

const sizes = {
  '2xl': 'text-display-2xl',
  xl: 'text-display-xl',
  lg: 'text-display-lg',
  md: 'text-display-md',
  sm: 'text-display-sm',
} as const;

export type HeadingSize = keyof typeof sizes;

/** The size each level gets unless told otherwise. */
const defaultSize: Record<1 | 2 | 3 | 4, HeadingSize> = { 1: 'xl', 2: 'lg', 3: 'md', 4: 'sm' };

type HeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  /** Document outline level. Choose it for structure, then `size` for looks. */
  level: 1 | 2 | 3 | 4;
  size?: HeadingSize;
};

/** Display-face heading on the fluid type scale. Every page has exactly one level 1. */
export function Heading({ level, size, className, ...rest }: HeadingProps) {
  const Tag = `h${level}` as const;
  return (
    <Tag
      className={cn(
        'font-display text-balance text-(--color-text)',
        sizes[size ?? defaultSize[level]],
        className,
      )}
      {...rest}
    />
  );
}
