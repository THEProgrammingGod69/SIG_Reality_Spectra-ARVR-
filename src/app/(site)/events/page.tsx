import { Suspense } from 'react';

import { CurrentEvents } from '@/components/sections/current-events';
import { EventTimeline } from '@/components/sections/event-timeline';
import { LoadFailed } from '@/components/sections/load-failed';
import { PageIntro } from '@/components/sections/page-intro';
import { JsonLd } from '@/components/site/json-ld';
import { Section } from '@/components/ui/section';
import { Skeleton } from '@/components/ui/skeleton';
import { socialLinks } from '@/lib/content';
import { getPublicEvents, publicRead } from '@/lib/data';
import { publicEnv } from '@/lib/env.public';
import { pageMetadata } from '@/lib/metadata';
import { clubCredit, getRoute, routeTitle } from '@/lib/site';
import { eventsJsonLd } from '@/lib/structured-data';

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
  const read = await publicRead('the events', getPublicEvents);
  if ('failed' in read) {
    return (
      <Section>
        <LoadFailed what="Events" />
      </Section>
    );
  }
  return (
    <>
      {read.data.current.length > 0 ? (
        <JsonLd data={eventsJsonLd(read.data.current, publicEnv.NEXT_PUBLIC_SITE_URL)} />
      ) : null}
      <CurrentEvents events={read.data.current} socials={socialLinks} />
      <EventTimeline events={read.data.timeline} />
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
