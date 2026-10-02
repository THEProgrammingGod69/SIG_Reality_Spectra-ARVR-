import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

const widths = {
  content: 'max-w-content',
  prose: 'max-w-prose',
} as const;

type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  /** `content` (1200px) for layouts, `prose` for long reading. */
  width?: keyof typeof widths;
};

/** Centres content at a token width with the responsive page gutter. */
export function Container({ width = 'content', className, ...rest }: ContainerProps) {
  return <div className={cn('mx-auto w-full px-gutter', widths[width], className)} {...rest} />;
}
