import { DatabaseZap, ServerCrash } from 'lucide-react';

import { EmptyState } from '@/components/ui/empty-state';
import { dataAvailability } from '@/lib/data';

/**
 * How to connect the data store, for the backend this deployment would use.
 * Netlify Blobs needs nothing (only a build without its credentials lands
 * here); Vercel Blob needs one store connected to the project (D-040, D-041).
 */
const HOW_TO_CONNECT: Record<string, string> = {
  'netlify-blobs':
    'Netlify Blobs is built into every Netlify site and needs no setup. This deploy was started without it: trigger a new deploy in Netlify (Deploys → Trigger deploy) and reload.',
  'vercel-blob':
    'On Vercel, connect one Blob store to this project once: Vercel → the project → Storage → Create → Blob, access Private, connect it to all environments, then Deployments → Redeploy. Everything after that is automatic.',
  upstash:
    'Set the Upstash Redis and Cloudflare R2 variables in the host (docs/SETUP_STORAGE.md), then redeploy.',
  local: "Set DATA_BACKEND=local in .env.local on a developer's computer.",
};

/**
 * What an admin page shows when it cannot reach the data: either no data
 * store is configured here, or the configured one did not answer.
 */
export function DataUnavailable({ reason }: { reason: 'not-configured' | 'unreachable' }) {
  const { backend } = dataAvailability();
  return reason === 'not-configured' ? (
    <EmptyState
      icon={DatabaseZap}
      title="Data store not connected"
      description={`Nothing can be read or saved until the data store is connected. ${HOW_TO_CONNECT[backend] ?? HOW_TO_CONNECT.upstash}`}
    />
  ) : (
    <EmptyState
      icon={ServerCrash}
      title="Could not reach the data store"
      description="The site's data could not be read just now. Reload in a moment; if it keeps happening, check the data store's settings on the dashboard."
    />
  );
}
