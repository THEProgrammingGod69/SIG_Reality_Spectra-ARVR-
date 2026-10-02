import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

import { Container } from './container';

type SectionProps = HTMLAttributes<HTMLElement> & {
  /** id of the section's heading, which names the landmark. */
  labelledBy?: string;
  /** Width of the inner container; `false` for full-bleed content. */
  width?: 'content' | 'prose' | false;
  containerClassName?: string;
};

/**
 * A page section on the vertical rhythm token (`py-section`), with its content
 * centred in a Container. Pass `labelledBy` so screen readers list it by name.
 */
export function Section({
  labelledBy,
  width = 'content',
  className,
  containerClassName,
  children,
  ...rest
}: SectionProps) {
  return (
    <section aria-labelledby={labelledBy} className={cn('py-section', className)} {...rest}>
      {width === false ? (
        children
      ) : (
        <Container width={width} className={containerClassName}>
          {children}
        </Container>
      )}
    </section>
  );
}
