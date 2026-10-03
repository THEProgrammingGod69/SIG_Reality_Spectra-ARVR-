import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { AdminPageHeader } from '@/components/admin/admin-page';
import { DataUnavailable } from '@/components/admin/data-unavailable';
import { EventPhaseBadge } from '@/components/admin/event-phase-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { adminRead } from '@/lib/data';
import { formatDateTime } from '@/lib/dates';
import { eventPhase } from '@/lib/schemas/event';

import { EventEditor } from '../_components/event-editor';

export const metadata: Metadata = { title: 'Edit event' };

export default function EditEventPage({ params }: PageProps<'/admin/events/[id]'>) {
  return (
    <Suspense fallback={<Skeleton className="h-96 rounded-card" />}>
      <EditEvent params={params} />
    </Suspense>
  );
}

async function EditEvent({ params }: Pick<PageProps<'/admin/events/[id]'>, 'params'>) {
  const { id } = await params;
  const read = await adminRead('an event', async ({ events }, now) => {
    const event = await events.get(id);
    return event ? { event, phase: eventPhase(event, now) } : null;
  });
  if ('unavailable' in read) {
    return (
      <>
        <AdminPageHeader href="/admin/events" back title="Edit event" />
        <DataUnavailable reason={read.unavailable} />
      </>
    );
  }
  if (read.data === null) notFound();
  const { event, phase } = read.data;

  return (
    <>
      <AdminPageHeader
        href="/admin/events"
        back
        title={event.title}
        description={`${formatDateTime(event.startsAt)} · last saved ${formatDateTime(event.updatedAt)}${event.updatedBy ? ` by ${event.updatedBy}` : ''}`}
        actions={<EventPhaseBadge phase={phase} />}
      />
      <EventEditor event={event} />
    </>
  );
}
