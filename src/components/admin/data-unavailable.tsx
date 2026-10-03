import { DatabaseZap, ServerCrash } from 'lucide-react';

import { EmptyState } from '@/components/ui/empty-state';

/**
 * What an admin page shows when it cannot reach the data: either no data
 * store is configured here, or the configured one did not answer.
 */
export function DataUnavailable({ reason }: { reason: 'not-configured' | 'unreachable' }) {
  return reason === 'not-configured' ? (
    <EmptyState
      icon={DatabaseZap}
      title="Data store not connected"
      description="Nothing can be read or saved until the Upstash Redis variables are set (docs/SETUP_STORAGE.md), or DATA_BACKEND=local on a developer's computer."
    />
  ) : (
    <EmptyState
      icon={ServerCrash}
      title="Could not reach the data store"
      description="The site's data could not be read just now. Reload in a moment; if it keeps happening, check the Upstash variables."
    />
  );
}
