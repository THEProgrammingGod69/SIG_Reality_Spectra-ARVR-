import { ServerCrash } from 'lucide-react';

import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/cn';

/**
 * What a public section shows when its data could not be read (`publicRead`
 * returned `failed`): a calm note, never an error page (rule 9).
 *
 * `inline` is the one-line form, for a section that still has something to
 * show without the store — the gallery keeps its Git archive.
 */
export function LoadFailed({
  what,
  inline = false,
  className,
}: {
  what: string;
  inline?: boolean;
  className?: string;
}) {
  if (inline) {
    return (
      <p className={cn('flex items-center gap-2 text-body-sm text-(--color-muted)', className)}>
        <Icon icon={ServerCrash} size="sm" />
        {what} could not be loaded right now. Please try again in a moment.
      </p>
    );
  }
  return (
    <EmptyState
      icon={ServerCrash}
      title={`${what} could not be loaded right now`}
      description="Please try again in a moment."
      className={className}
    />
  );
}
