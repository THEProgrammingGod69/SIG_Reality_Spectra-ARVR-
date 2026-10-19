import type { HTMLAttributes } from 'react';

import { Spotlight } from '@/components/motion/spotlight';
import { cn } from '@/lib/cn';

/**
 * Card family — the container for events, team members and photos.
 *
 * Built so admin data can never break the layout (rule 9): media sits in a
 * fixed aspect ratio, titles clamp at two lines and descriptions at three, long
 * unbroken words wrap, and the card fills its grid cell (`h-full`, `min-w-0`).
 */

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: 'article' | 'section' | 'aside' | 'div' | 'li';
  /** Rim light: a thin spectrum line along the top edge, for highlighted cards. */
  featured?: boolean;
  /** Lift and border glow on hover / keyboard focus, for cards that link somewhere. */
  interactive?: boolean;
  /**
   * A light that follows the mouse across the card, with a rim along its edge
   * (`Spotlight`, D-037). Mouse only; nothing under reduced motion.
   */
  spotlight?: boolean;
};

export function Card({
  as: Tag = 'article',
  featured = false,
  interactive = false,
  spotlight = false,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <Tag
      className={cn(
        'relative flex h-full min-w-0 flex-col overflow-hidden rounded-card border border-(--color-border) bg-(--color-surface) shadow-card',
        // Its own stacking context, so the spotlight sits behind the content
        // and above the card's background.
        spotlight && 'isolate',
        featured &&
          'before:absolute before:inset-x-0 before:top-0 before:z-10 before:h-px before:bg-(image:--gradient-rim)',
        interactive &&
          'transition-transform duration-(--dur-short) ease-out-expo focus-within:-translate-y-1 hover:-translate-y-1 ' +
            'after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:border after:border-(--color-accent)/50 after:opacity-0 after:transition-opacity after:duration-(--dur-short) focus-within:after:opacity-100 hover:after:opacity-100',
        className,
      )}
      {...rest}
    >
      {spotlight ? <Spotlight /> : null}
      {children}
    </Tag>
  );
}

const ratios = {
  '16/9': 'aspect-video',
  '4/3': 'aspect-4/3',
  '4/5': 'aspect-4/5',
  '1/1': 'aspect-square',
} as const;

export type CardRatio = keyof typeof ratios;

type CardMediaProps = HTMLAttributes<HTMLDivElement> & {
  /** Fixed ratio, so an image of any shape crops instead of resizing the card. */
  ratio?: CardRatio;
};

/** Media slot. Put a `next/image` with `fill` and `object-cover` inside. */
export function CardMedia({ ratio = '16/9', className, ...rest }: CardMediaProps) {
  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden bg-(--color-surface-raised)',
        ratios[ratio],
        className,
      )}
      {...rest}
    />
  );
}

export function CardBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-1 flex-col gap-3 p-6', className)} {...rest} />;
}

type CardTitleProps = HTMLAttributes<HTMLHeadingElement> & {
  as?: 'h2' | 'h3' | 'h4';
};

export function CardTitle({ as: Tag = 'h3', className, ...rest }: CardTitleProps) {
  return (
    <Tag
      className={cn(
        'line-clamp-2 font-display text-display-sm wrap-anywhere text-(--color-text)',
        className,
      )}
      {...rest}
    />
  );
}

export function CardDescription({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('line-clamp-3 text-body-sm wrap-anywhere text-(--color-muted)', className)}
      {...rest}
    />
  );
}

/** Actions or metadata, pinned to the bottom so a grid of cards lines up. */
export function CardFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mt-auto flex flex-wrap items-center gap-3 pt-2', className)} {...rest} />
  );
}
