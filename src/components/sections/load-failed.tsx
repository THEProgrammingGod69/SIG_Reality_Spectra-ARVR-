import { ServerCrash } from 'lucide-react';

import { EmptyState } from '@/components/ui/empty-state';

/**
 * What a public section shows when its data could not be read (`publicRead`
 * returned `failed`): a calm note, never an error page (rule 9).
 */
export function LoadFailed({ what, className }: { what: string; className?: string }) {
  return (
    <EmptyState
      icon={ServerCrash}
      title={`${what} could not be loaded right now`}
      description="Please try again in a moment."
      className={className}
    />
  );
}
