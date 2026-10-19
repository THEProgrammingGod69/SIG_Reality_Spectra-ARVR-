import { Plus } from 'lucide-react';
import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AdminPageHeader } from '@/components/admin/admin-page';
import { DataUnavailable } from '@/components/admin/data-unavailable';
import { EventList, type PhasedEvent } from '@/components/admin/event-list';
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
import { adminRead } from '@/lib/data';
import { type EventPhase, eventPhase } from '@/lib/schemas/event';

import { TimelineButton } from './_components/timeline-button';

export const metadata: Metadata = { title: 'Events' };

/** The groups, in the order an admin works through them. */
const GROUPS = [
  {
    phases: ['current', 'draft'],
    title: 'Upcoming',
    description: 'Published events are live on /events; drafts are not shown yet.',
    empty: 'No upcoming events. Add one to show it on /events.',
  },
  {
    phases: ['awaiting'],
    title: 'Ended — not on the timeline yet',
    description:
      'Put each on the timeline in one click; a recap and photos can be added any time in its editor.',
    empty: 'Nothing waiting.',
  },
  {
    phases: ['timeline'],
    title: 'On the timeline',
    description: 'Shown in the /events timeline, with their photos in /gallery.',
    empty: 'No events on the timeline yet.',
  },
] as const satisfies readonly {
  phases: readonly EventPhase[];
  title: string;
  description: string;
  empty: string;
}[];

export default function AdminEventsPage() {
  return (
    <>
      <AdminPageHeader
        href="/admin/events"
        actions={
          <Button asChild>
            <GuardedLink href="/admin/events/new">
              <Icon icon={Plus} size="sm" />
              Add event
            </GuardedLink>
          </Button>
        }
      />
      <Suspense fallback={<Skeleton className="h-96 rounded-card" />}>
        <EventGroups />
      </Suspense>
    </>
  );
}

async function EventGroups() {
  const read = await adminRead('the events', async ({ events }, now) =>
    (await events.list()).map((event): PhasedEvent => ({ event, phase: eventPhase(event, now) })),
  );
  if ('unavailable' in read) return <DataUnavailable reason={read.unavailable} />;

  return GROUPS.map((group) => {
    const items = read.data.filter((item) =>
      (group.phases as readonly EventPhase[]).includes(item.phase),
    );
    // Upcoming soonest first; ended ones most recent first.
    if (group.phases[0] !== 'current') items.reverse();
    return (
      <Card key={group.title}>
        <CardHeader>
          <CardTitle>
            <h2>
              {group.title} <span className="text-muted-foreground">({items.length})</span>
            </h2>
          </CardTitle>
          <CardDescription>{group.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <EventList
            items={items}
            empty={group.empty}
            {...(group.phases[0] === 'awaiting'
              ? {
                  action: ({ event }: PhasedEvent) => (
                    <TimelineButton id={event.id} version={event.updatedAt} title={event.title} />
                  ),
                }
              : {})}
          />
        </CardContent>
      </Card>
    );
  });
}
