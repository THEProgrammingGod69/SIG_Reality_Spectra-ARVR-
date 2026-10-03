import type { ReactNode } from 'react';

import { DataUnavailable } from '@/components/admin/data-unavailable';
import { EventList } from '@/components/admin/event-list';
import { Badge } from '@/components/admin/ui/badge';
import { Button } from '@/components/admin/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/admin/ui/card';
import { GuardedLink } from '@/components/admin/unsaved-changes';
import { Skeleton } from '@/components/ui/skeleton';
import { adminRead, type DataServices } from '@/lib/data';
import { eventPhase } from '@/lib/schemas/event';
import type { AdminRouteHref } from '@/lib/site';

/** How many events each list shows before "see all". */
const LIST_LIMIT = 5;

/** Everything the dashboard reports, read fresh (admin reads are never cached). */
async function loadOverview({ events, sponsorships, recruitment }: DataServices, now: Date) {
  const [allEvents, requests, settings] = await Promise.all([
    events.list(),
    sponsorships.list(),
    recruitment.get(),
  ]);
  const phased = allEvents.map((event) => ({ event, phase: eventPhase(event, now) }));
  return {
    // Events are listed by start time, so these are soonest first…
    upcoming: phased.filter(({ phase }) => phase === 'current' || phase === 'draft'),
    // …and these most recently ended first.
    awaiting: phased.filter(({ phase }) => phase === 'awaiting').reverse(),
    newRequests: requests.filter((request) => request.status === 'new').length,
    totalRequests: requests.length,
    recruitment: settings,
  };
}

/** The dashboard's live part. Reads the data store at request time. */
export async function Overview() {
  const read = await adminRead('the dashboard', loadOverview);
  if ('unavailable' in read) return <DataUnavailable reason={read.unavailable} />;

  const { upcoming, awaiting, newRequests, totalRequests, recruitment } = read.data;
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <OverviewCard
        title="Upcoming events"
        description="Published events are live on /events; drafts are not."
        href="/admin/events"
        action="Manage events"
      >
        <EventList items={upcoming} empty="No upcoming events." limit={LIST_LIMIT} />
      </OverviewCard>

      <OverviewCard
        title="Awaiting the timeline"
        description="Ended events. Add a recap and photos to put them on the timeline."
        href="/admin/events"
        action="Complete events"
      >
        <EventList
          items={awaiting}
          empty="Nothing waiting: every ended event is on the timeline."
          limit={LIST_LIMIT}
        />
      </OverviewCard>

      <OverviewCard
        title="Sponsorship requests"
        description="Sent from the Contact page."
        href="/admin/sponsorships"
        action="Open the inbox"
      >
        <p className="font-display text-display-lg text-foreground">{newRequests}</p>
        <p className="text-body-sm text-muted-foreground">
          new {newRequests === 1 ? 'request' : 'requests'}, of {totalRequests} in total
        </p>
      </OverviewCard>

      <OverviewCard
        title="Recruitment"
        description="What the Recruitment page and the header show."
        href="/admin/recruitment"
        action="Recruitment settings"
      >
        {recruitment === null ? (
          <p className="text-body-sm text-muted-foreground">
            Not saved here yet. The site shows the status in src/content/recruitment.json until
            Stage 8 moves it into this panel.
          </p>
        ) : (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-body-sm">
            <dt className="text-muted-foreground">Status</dt>
            <dd>
              <Badge variant={recruitment.open ? 'success' : 'outline'}>
                {recruitment.open ? 'Open' : 'Closed'}
              </Badge>
            </dd>
            <dt className="text-muted-foreground">Application form</dt>
            <dd className="text-foreground">{recruitment.formUrl ? 'Linked' : 'Not set'}</dd>
            <dt className="text-muted-foreground">Roles PDF</dt>
            <dd className="text-foreground">
              {recruitment.rolesPdfUrl ? 'Uploaded' : 'Not uploaded (shown as “coming soon”)'}
            </dd>
          </dl>
        )}
      </OverviewCard>
    </div>
  );
}

function OverviewCard({
  title,
  description,
  href,
  action,
  children,
}: {
  title: string;
  description: string;
  href: AdminRouteHref;
  action: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-1">{children}</CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" asChild>
          <GuardedLink href={href}>{action}</GuardedLink>
        </Button>
      </CardFooter>
    </Card>
  );
}

export function OverviewLoading() {
  return (
    <div className="grid gap-6 md:grid-cols-2" aria-busy="true">
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className="h-56 rounded-card" />
      ))}
    </div>
  );
}
