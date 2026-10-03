import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { AdminPageHeader } from '@/components/admin/admin-page';
import { DataUnavailable } from '@/components/admin/data-unavailable';
import { Skeleton } from '@/components/ui/skeleton';
import { dataAvailability } from '@/lib/data';

import { EventEditor } from '../_components/event-editor';

export const metadata: Metadata = { title: 'New event' };

export default function NewEventPage() {
  return (
    <>
      <AdminPageHeader
        href="/admin/events"
        back
        title="New event"
        description="Save it as a draft, then publish when the registration link is ready."
      />
      <Suspense fallback={<Skeleton className="h-96 rounded-card" />}>
        <NewEvent />
      </Suspense>
    </>
  );
}

async function NewEvent() {
  if (!dataAvailability().records) return <DataUnavailable reason="not-configured" />;
  // A fresh id per visit, so uploads can be filed under the event before it is saved.
  await connection();
  return <EventEditor event={null} newId={crypto.randomUUID()} />;
}
