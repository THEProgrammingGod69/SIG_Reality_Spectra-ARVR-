import { ShieldAlert } from 'lucide-react';

import { Badge } from '@/components/admin/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/admin/ui/card';
import { Icon } from '@/components/ui/icon';
import { setup } from '@/lib/auth/config';
import { MIN_STRONG_PASSWORD_LENGTH } from '@/lib/auth/policy';
import { dataAvailability } from '@/lib/data';
import { envWarnings } from '@/lib/env';
import { integrations } from '@/lib/integrations';

/** Where this deployment keeps records and files, in words for the dashboard. */
const BACKEND_LABELS = {
  'netlify-blobs': 'Netlify Blobs (built into Netlify)',
  'vercel-blob': 'Vercel Blob (connected to the Vercel project)',
  upstash: 'Upstash Redis and Cloudflare R2',
  local: 'This computer (the .data folder)',
} as const;

/** Integrations a host's blob store replaces: shown as not needed, not as missing. */
const REPLACED_BY_BLOBS: readonly string[] = ['redis', 'r2'];

/**
 * Which outside services this deployment has credentials for. Placeholders
 * are expected while the club's accounts are being set up; this list is the
 * reminder of what is still to fill in (docs/OPEN_ITEMS.md has the full swap
 * list).
 */
export function SetupChecklist() {
  const { backend } = dataAvailability();
  const notNeeded = (id: string) =>
    (backend === 'netlify-blobs' || backend === 'vercel-blob') && REPLACED_BY_BLOBS.includes(id);
  const relevant = integrations.filter((integration) => !notNeeded(integration.id));
  const missing = relevant.filter(
    (integration) => !integration.configured && !integration.optional,
  ).length;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Setup</CardTitle>
        <CardDescription>
          {missing === 0
            ? 'Every service this site uses is configured.'
            : `${missing} of ${relevant.length} services still use placeholder (empty) credentials.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {setup.weakPassword ? (
          // Never the password itself: only that it needs changing.
          <div className="flex flex-col gap-1 rounded-control border border-destructive/40 p-3 text-body-sm text-foreground">
            <p className="flex items-center gap-2 font-medium">
              <Icon icon={ShieldAlert} size="sm" className="text-destructive" />
              Weak admin password — set a longer ADMIN_PASSWORD in the host&apos;s settings
            </p>
            <p className="text-xs text-muted-foreground">
              It is shorter than {MIN_STRONG_PASSWORD_LENGTH} characters or a well-known password,
              so it is easy to guess. A long passphrase works best; changing it signs every admin
              out.
            </p>
          </div>
        ) : null}
        <p className="text-body-sm text-foreground">
          <span className="text-muted-foreground">Data is stored in: </span>
          {BACKEND_LABELS[backend]}
        </p>
        {envWarnings.length > 0 ? (
          // Settings the site corrected or ignored instead of failing (D-041).
          <div className="flex flex-col gap-1 rounded-control border border-warning/40 p-3 text-body-sm text-foreground">
            <p className="font-medium">Settings that were corrected or ignored</p>
            <ul className="list-disc ps-5 text-xs text-muted-foreground">
              {envWarnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {backend === 'local' ? (
          <p className="rounded-control border border-warning/40 p-3 text-body-sm text-foreground">
            <Badge variant="warning" className="me-2">
              Local data
            </Badge>
            Records and uploads are kept in the .data folder on this computer (D-031). Nothing here
            reaches the live site; it switches to Upstash and R2 once their variables are set and
            DATA_BACKEND is removed.
          </p>
        ) : null}
        <ul className="flex flex-col divide-y">
          {integrations.map((integration) => (
            <li
              key={integration.id}
              className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-body-sm font-medium text-foreground">{integration.label}</p>
                <p className="text-xs text-muted-foreground">{integration.purpose}</p>
                <p className="mt-1 font-mono text-xs break-all text-muted-foreground">
                  {integration.variables.join(' · ')}
                </p>
                {integration.id === 'admins' && setup.admins.length > 0 ? (
                  <p className="mt-1 text-xs break-all text-foreground">
                    {setup.admins.join(', ')}
                  </p>
                ) : null}
              </div>
              {notNeeded(integration.id) ? (
                <Badge variant="outline">Not needed</Badge>
              ) : integration.configured ? (
                <Badge variant="success">Configured</Badge>
              ) : integration.optional ? (
                <Badge variant="outline">Optional</Badge>
              ) : (
                <Badge variant="warning">Not set</Badge>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
