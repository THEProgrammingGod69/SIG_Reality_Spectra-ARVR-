import { Inbox, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

import { Icon } from './icon';

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  /** Optional next step, e.g. a ButtonLink. */
  action?: ReactNode;
  className?: string;
};

/**
 * What a list shows when it has nothing in it (rule 9: every list has one).
 * Calm and explanatory — never an error state.
 */
export function EmptyState({
  title,
  description,
  icon = Inbox,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-4 rounded-card border border-dashed border-(--color-border-strong) px-6 py-12 text-center',
        className,
      )}
    >
      <span className="inline-flex size-12 items-center justify-center rounded-full bg-(--color-surface-raised) text-(--color-muted)">
        <Icon icon={icon} size="lg" />
      </span>
      <div className="flex max-w-prose flex-col gap-2">
        <p className="font-display text-display-sm text-(--color-text)">{title}</p>
        {description ? <p className="text-body-sm text-(--color-muted)">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
