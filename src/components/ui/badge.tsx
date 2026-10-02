import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

/** Every tone's text passes AA on the badge background (tests/unit/contrast.test.ts). */
const tones = {
  neutral: 'text-(--color-muted) border-(--color-border-strong)',
  accent: 'text-(--color-accent) border-(--color-accent)/40',
  success: 'text-(--color-success) border-(--color-success)/40',
  warning: 'text-(--color-warning) border-(--color-warning)/40',
  danger: 'text-(--color-danger) border-(--color-danger)/40',
} as const;

export type BadgeTone = keyof typeof tones;

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

/**
 * Small status or category label (event category, "Recruiting", draft state).
 * Long labels truncate rather than stretch their container.
 */
export function Badge({ tone = 'neutral', className, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        // inline-block (not flex) so `truncate` can draw its ellipsis.
        'inline-block max-w-full truncate rounded-full border bg-(--color-surface-raised) px-2.5 py-1 align-middle font-mono text-label uppercase',
        tones[tone],
        className,
      )}
      {...rest}
    />
  );
}
