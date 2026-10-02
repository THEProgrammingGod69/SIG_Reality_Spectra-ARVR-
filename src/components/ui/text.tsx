import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

const sizes = {
  lg: 'text-body-lg',
  md: 'text-body',
  sm: 'text-body-sm',
} as const;

/** `subtle` is for captions and metadata only (D-003), never running text. */
const tones = {
  primary: 'text-(--color-text)',
  body: 'text-(--color-text-body)',
  muted: 'text-(--color-muted)',
  subtle: 'text-(--color-subtle)',
} as const;

type TextProps = HTMLAttributes<HTMLElement> & {
  as?: 'p' | 'span' | 'div';
  size?: keyof typeof sizes;
  tone?: keyof typeof tones;
};

/** Body copy in Inter on the type scale. */
export function Text({ as: Tag = 'p', size = 'md', tone = 'body', className, ...rest }: TextProps) {
  return <Tag className={cn('text-pretty', sizes[size], tones[tone], className)} {...rest} />;
}

type EyebrowProps = HTMLAttributes<HTMLElement> & {
  as?: 'p' | 'span';
};

/**
 * Small uppercase mono label — eyebrows above headings, metadata, the
 * "Special Interest Group · VIT Pune" credit. Echoes the logo's small caps.
 */
export function Eyebrow({ as: Tag = 'p', className, ...rest }: EyebrowProps) {
  return (
    <Tag
      className={cn('font-mono text-label text-(--color-muted) uppercase', className)}
      {...rest}
    />
  );
}
