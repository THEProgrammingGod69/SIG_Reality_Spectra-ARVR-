import { ServerCrash } from 'lucide-react';
import { unstable_rethrow } from 'next/navigation';
import { Suspense } from 'react';

import { CurrentEvents } from '@/components/sections/current-events';
import { EventTimeline } from '@/components/sections/event-timeline';
import { PageIntro } from '@/components/sections/page-intro';
import { EmptyState } from '@/components/ui/empty-state';
import { Section } from '@/components/ui/section';
import { Skeleton } from '@/components/ui/skeleton';
import { socialLinks } from '@/lib/content';
import { getPublicEvents } from '@/lib/data';
import { pageMetadata } from '@/lib/metadata';
import { clubCredit, getRoute, routeTitle } from '@/lib/site';

const route = getRoute('/events');

export const metadata = pageMetadata(route);

export default function EventsPage() {
  return (
    <>
      <PageIntro
        id="events-title"
        eyebrow={clubCredit}
        title={routeTitle(route)}
        lead={route.description}
      />
      <Suspense fallback={<EventsLoading />}>
        <Events />
      </Suspense>
    </>
  );
}

/** Which events are current is decided per request (rule 12), so this streams in. */
async function Events() {
  let events: Awaited<ReturnType<typeof getPublicEvents>>;
  try {
    events = await getPublicEvents();
  } catch (error) {
    // Next.js signals request-time rendering by throwing; that is not a failure.
    unstable_rethrow(error);
    console.error('[events] Could not load the events.', error);
    return (
      <Section>
        <EmptyState
          icon={ServerCrash}
          title="Events could not be loaded right now"
          description="Please try again in a moment."
        />
      </Section>
    );
  }
  return (
    <>
      <CurrentEvents events={events.current} socials={socialLinks} />
      <EventTimeline events={events.timeline} />
    </>
  );
}

function EventsLoading() {
  return (
    <Section aria-busy="true">
      <Skeleton className="h-8 w-56" />
      <div className="mt-10 grid grid-cols-[repeat(auto-fill,minmax(min(100%,20rem),1fr))] gap-6">
        <Skeleton className="aspect-4/5 rounded-card" />
      </div>
    </Section>
  );
}
