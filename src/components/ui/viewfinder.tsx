import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

/** The four corners, each a pair of borders drawn just outside the content. */
const corners = [
  'top-0 left-0 border-t border-l rounded-tl-control',
  'top-0 right-0 border-t border-r rounded-tr-control',
  'bottom-0 left-0 border-b border-l rounded-bl-control',
  'bottom-0 right-0 border-b border-r rounded-br-control',
] as const;

/**
 * A camera's viewfinder around a QR code (D-037): four accent corner brackets
 * a step outside the code — the lab's "scan me", and the same corner language
 * as the hero's FocusText frame. Static; it never moves over the code, so it
 * never gets in a phone camera's way.
 */
export function Viewfinder({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('relative p-3', className)}>
      {corners.map((corner) => (
        <span
          key={corner}
          aria-hidden="true"
          className={cn('absolute size-5 border-(--color-accent)', corner)}
        />
      ))}
      {children}
    </div>
  );
}
