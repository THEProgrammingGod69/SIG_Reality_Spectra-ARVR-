import { eventEndsAt, type EventMode } from './schemas/event';
import type { Image } from './schemas/image';
import { siteConfig } from './site';

/**
 * schema.org structured data for search engines (JSON-LD). Pure functions, so
 * the output is unit-tested; the home page renders it in a <script> tag.
 */

type OrganizationInput = {
  siteUrl: string;
  description: string;
  slogan: string;
  email: string | null;
  /** Public profile pages (`sameAs`). Invite links such as WhatsApp are not profiles. */
  profiles: readonly string[];
};

export function organizationJsonLd({
  siteUrl,
  description,
  slogan,
  email,
  profiles,
}: OrganizationInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: new URL('/', siteUrl).toString(),
    logo: new URL('/icon.png', siteUrl).toString(),
    description,
    slogan,
    parentOrganization: { '@type': 'CollegeOrUniversity', name: siteConfig.parentOrganisation },
    ...(email ? { email } : {}),
    ...(profiles.length > 0 ? { sameAs: [...profiles] } : {}),
  };
}

type EventInput = {
  title: string;
  summary: string;
  startsAt: string;
  endsAt: string | null;
  venue: string;
  mode: EventMode;
  registrationUrl: string | null;
  poster: Image | null;
};

const ATTENDANCE: Record<EventMode, string> = {
  offline: 'https://schema.org/OfflineEventAttendanceMode',
  online: 'https://schema.org/OnlineEventAttendanceMode',
  hybrid: 'https://schema.org/MixedEventAttendanceMode',
};

/**
 * The current events on /events as schema.org Events (D-033), so search
 * engines can show them with their date, place and registration link.
 * Single-day events end at midnight club time, as everywhere on the site.
 */
export function eventsJsonLd(events: readonly EventInput[], siteUrl: string) {
  const absolute = (path: string) => new URL(path, siteUrl).toString();
  return {
    '@context': 'https://schema.org',
    '@graph': events.map((event) => {
      const online = event.registrationUrl
        ? { '@type': 'VirtualLocation', url: event.registrationUrl }
        : null;
      const venue = { '@type': 'Place', name: event.venue, address: siteConfig.parentOrganisation };
      return {
        '@type': 'Event',
        name: event.title,
        description: event.summary,
        startDate: event.startsAt,
        endDate: eventEndsAt(event).toISOString(),
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: ATTENDANCE[event.mode],
        location:
          event.mode === 'online'
            ? (online ?? venue)
            : event.mode === 'hybrid' && online
              ? [venue, online]
              : venue,
        ...(event.poster ? { image: [absolute(event.poster.url)] } : {}),
        url: absolute('/events'),
        organizer: { '@type': 'Organization', name: siteConfig.name, url: absolute('/') },
        ...(event.registrationUrl
          ? { offers: { '@type': 'Offer', url: event.registrationUrl } }
          : {}),
      };
    }),
  };
}

/**
 * Serialise for a <script type="application/ld+json">. `<` is escaped so no
 * value can close the script tag early.
 */
export function jsonLdScript(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
