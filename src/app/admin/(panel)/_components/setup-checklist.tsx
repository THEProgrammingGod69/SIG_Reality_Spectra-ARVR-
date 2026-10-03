import { Badge } from '@/components/admin/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/admin/ui/card';
import { setup } from '@/lib/auth/config';
import { dataAvailability } from '@/lib/data';
import { integrations } from '@/lib/integrations';

/**
 * Which outside services this deployment has credentials for. Placeholders
 * are expected while the club's accounts are being set up; this list is the
 * reminder of what is still to fill in (docs/OPEN_ITEMS.md has the full swap
 * list).
 */
export function SetupChecklist() {
  const missing = integrations.filter((integration) => !integration.configured).length;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Setup</CardTitle>
        <CardDescription>
          {missing === 0
            ? 'Every service this site uses is configured.'
            : `${missing} of ${integrations.length} services still use placeholder (empty) credentials.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {dataAvailability().backend === 'local' ? (
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
              <Badge variant={integration.configured ? 'success' : 'warning'}>
                {integration.configured ? 'Configured' : 'Not set'}
              </Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
