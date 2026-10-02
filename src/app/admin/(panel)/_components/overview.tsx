import { DatabaseZap, ServerCrash } from 'lucide-react';
import { connection } from 'next/server';
import type { ReactNode } from 'react';

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
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { repositories } from '@/lib/data';
import { formatDateTime } from '@/lib/dates';
import { isConfigured } from '@/lib/integrations';
import { type Event, eventPhase } from '@/lib/schemas/event';
import type { AdminRouteHref } from '@/lib/site';

/** How many events each list shows before "see all". */
const LIST_LIMIT = 5;

/** Everything the dashboard reports, read fresh (admin reads are never cached). */
async function loadOverview(now: Date) {
  const { events, sponsorships, recruitment } = repositories();
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
  if (!isConfigured('redis')) {
    return (
      <EmptyState
        icon={DatabaseZap}
        title="Data store not connected"
        description="Events, requests and recruitment appear here once the Upstash Redis variables are set (docs/SETUP_STORAGE.md)."
      />
    );
  }

  await connection();
  let overview: Awaited<ReturnType<typeof loadOverview>>;
  try {
    overview = await loadOverview(new Date());
  } catch (error) {
    console.error('[admin] The dashboard could not read the data store.', error);
    return (
      <EmptyState
        icon={ServerCrash}
        title="Could not reach the data store"
        description="The site's data could not be read just now. Reload in a moment; if it keeps happening, check the Upstash variables."
      />
    );
  }

  const { upcoming, awaiting, newRequests, totalRequests, recruitment } = overview;
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <OverviewCard
        title="Upcoming events"
        description="Published events are live on /events; drafts are not."
        href="/admin/events"
        action="Manage events"
      >
        <EventList
          items={upcoming}
          empty="No upcoming events."
          badge={({ phase }) =>
            phase === 'current' ? (
              <Badge variant="success">Published</Badge>
            ) : (
              <Badge variant="outline">Draft</Badge>
            )
          }
        />
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
          badge={() => <Badge variant="warning">Needs recap</Badge>}
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

type PhasedEvent = { event: Event; phase: ReturnType<typeof eventPhase> };

function EventList({
  items,
  empty,
  badge,
}: {
  items: readonly PhasedEvent[];
  empty: string;
  badge: (item: PhasedEvent) => ReactNode;
}) {
  if (items.length === 0) {
    return <p className="text-body-sm text-muted-foreground">{empty}</p>;
  }
  return (
    <>
      <ul className="flex flex-col divide-y">
        {items.slice(0, LIST_LIMIT).map((item) => (
          <li key={item.event.id} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="line-clamp-1 text-body-sm font-medium text-foreground">
                {item.event.title}
              </p>
              <p className="text-xs text-muted-foreground">{formatDateTime(item.event.startsAt)}</p>
            </div>
            {badge(item)}
          </li>
        ))}
      </ul>
      {items.length > LIST_LIMIT ? (
        <p className="text-xs text-muted-foreground">and {items.length - LIST_LIMIT} more</p>
      ) : null}
    </>
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
