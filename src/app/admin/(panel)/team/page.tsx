import { Plus } from 'lucide-react';
import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AdminPageHeader } from '@/components/admin/admin-page';
import { DataUnavailable } from '@/components/admin/data-unavailable';
import { Button } from '@/components/admin/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/admin/ui/card';
import { GuardedLink } from '@/components/admin/unsaved-changes';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { domainNames, domains } from '@/lib/content';
import { adminRead, groupTeam } from '@/lib/data';

import { CoreTeamList, SecretaryList } from './_components/team-list';

export const metadata: Metadata = { title: 'Team' };

export default function AdminTeamPage() {
  return (
    <>
      <AdminPageHeader
        href="/admin/team"
        actions={
          <Button asChild>
            <GuardedLink href="/admin/team/new">
              <Icon icon={Plus} size="sm" />
              Add member
            </GuardedLink>
          </Button>
        }
      />
      <Suspense fallback={<Skeleton className="h-96 rounded-card" />}>
        <TeamGroups />
      </Suspense>
    </>
  );
}

async function TeamGroups() {
  const read = await adminRead('the team', ({ team }) => team.list());
  if ('unavailable' in read) return <DataUnavailable reason={read.unavailable} />;

  const { core, secretaries } = groupTeam(
    read.data,
    domains.map((domain) => domain.id),
  );
  const led = new Set(secretaries.map((member) => member.domainId));
  const unled = domains.filter((domain) => !led.has(domain.id));

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>
              Core team <span className="text-muted-foreground">({core.length})</span>
            </h2>
          </CardTitle>
          <CardDescription>
            The office-bearers, shown first on About in this order. Use the arrows to reorder.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Fresh data after a save remounts the list with the new versions. */}
          <CoreTeamList key={core.map((member) => member.updatedAt).join()} members={core} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>
              Domain secretaries{' '}
              <span className="text-muted-foreground">({secretaries.length})</span>
            </h2>
          </CardTitle>
          <CardDescription>
            One per domain, shown after the core team in the order of the domains.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <SecretaryList members={secretaries} domainNames={domainNames} />
          {unled.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              No secretary yet for: {unled.map((domain) => domain.name).join(', ')}.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </>
  );
}
