import QRCode from 'qrcode';
import { describe, expect, it } from 'vitest';

import robots from '@/app/robots';
import sitemap from '@/app/sitemap';
import { qrPath } from '@/components/ui/qr-code';
import { defaultTitle, OG_IMAGE_SIZE, ogImagePath, pageMetadata } from '@/lib/metadata';
import { getRoute, siteConfig, siteRoutes } from '@/lib/site';
import { eventsJsonLd, jsonLdScript, organizationJsonLd } from '@/lib/structured-data';

describe('sitemap.xml', () => {
  it('lists every public page, absolute, and nothing else', () => {
    const entries = sitemap();
    expect(entries.map((e) => new URL(e.url).pathname)).toEqual(siteRoutes.map((r) => r.href));
    for (const entry of entries) {
      expect(entry.url).toMatch(/^https?:\/\//);
      expect(entry.url).not.toMatch(/\/(admin|dev|api)(\/|$)/);
    }
  });

  it('is referenced from robots.txt, which keeps admin and dev out', () => {
    const rules = robots();
    expect(String(rules.sitemap)).toMatch(/\/sitemap\.xml$/);
    expect(JSON.stringify(rules.rules)).toContain('/admin');
    expect(JSON.stringify(rules.rules)).toContain('/dev/');
  });
});

describe('pageMetadata', () => {
  it('gives each page its own canonical URL and share title', () => {
    for (const route of siteRoutes) {
      const metadata = pageMetadata(route);
      expect(metadata.alternates?.canonical).toBe(route.href);
      expect(metadata.openGraph?.url).toBe(route.href);
      const title = metadata.openGraph?.title;
      expect(title).toContain(siteConfig.name);
    }
  });

  it('gives Home the absolute default title and accepts a description override', () => {
    const metadata = pageMetadata(getRoute('/'), { description: 'Positioning line.' });
    expect(metadata.title).toEqual({ absolute: defaultTitle });
    expect(metadata.description).toBe('Positioning line.');
  });

  it('suffixes inner pages through the title template', () => {
    expect(pageMetadata(getRoute('/about')).title).toBe('About us & team');
    expect(pageMetadata(getRoute('/about')).openGraph?.title).toBe(
      `About us & team | ${siteConfig.name}`,
    );
  });
});

describe('structured data', () => {
  const data = organizationJsonLd({
    siteUrl: 'https://example.org',
    description: 'A club.',
    slogan: 'Explore. Build. Express.',
    email: null,
    profiles: ['https://www.instagram.com/x/'],
  });

  it('describes the club as an Organization under VIT Pune', () => {
    expect(data['@type']).toBe('Organization');
    expect(data.name).toBe(siteConfig.name);
    expect(data.url).toBe('https://example.org/');
    expect(data.logo).toBe('https://example.org/icon.png');
    expect(data.parentOrganization.name).toBe(siteConfig.parentOrganisation);
    expect(data.sameAs).toEqual(['https://www.instagram.com/x/']);
    expect('email' in data).toBe(false);
  });

  it('cannot break out of its script tag', () => {
    expect(jsonLdScript({ text: '</script><script>alert(1)</script>' })).not.toContain('</script>');
  });
});

describe('QR codes', () => {
  it('draw exactly the modules of the encoded link, inside a quiet zone', () => {
    const value = 'https://forms.gle/WoDyL1mwWHnnKFs38';
    const { path, size } = qrPath(value);
    const { modules } = QRCode.create(value, { errorCorrectionLevel: 'M' });

    expect(size).toBe(modules.size + 8);
    const dark = Array.from(modules.data).filter(Boolean).length;
    expect(path.match(/M/g)).toHaveLength(dark);
  });

  it('differ for different links and are stable for the same link', () => {
    expect(qrPath('https://a.example/').path).toBe(qrPath('https://a.example/').path);
    expect(qrPath('https://a.example/').path).not.toBe(qrPath('https://b.example/').path);
  });
});

describe('share images (D-033)', () => {
  it('gives every page its own image, at the size every platform accepts', () => {
    const paths = siteRoutes.map((route) => {
      const { openGraph, twitter } = pageMetadata(route);
      const [image] = (openGraph?.images ?? []) as { url: string; width: number }[];
      expect(image).toMatchObject({ url: ogImagePath(route), ...OG_IMAGE_SIZE });
      expect(JSON.stringify(twitter)).toContain(ogImagePath(route));
      return image!.url;
    });
    expect(paths).toContain('/og/home');
    expect(new Set(paths).size).toBe(siteRoutes.length);
  });
});

describe('event structured data (D-033)', () => {
  const event = {
    title: 'XR Build Night',
    summary: 'An overnight build sprint for AR and VR prototypes.',
    startsAt: '2030-06-01T12:30:00.000Z',
    endsAt: null,
    venue: 'Lab 3, VIT Pune',
    mode: 'hybrid' as const,
    registrationUrl: 'https://vierp.example.org/register',
    poster: { url: '/api/local-media/dev/poster.webp', alt: 'Poster', width: 1080, height: 1350 },
  };
  const [data] = eventsJsonLd([event], 'https://club.example.org')['@graph'];

  it('describes each current event with its dates, place and registration', () => {
    expect(data).toMatchObject({
      '@type': 'Event',
      name: event.title,
      startDate: event.startsAt,
      // A single-day event ends at midnight in India (18:30 UTC).
      endDate: '2030-06-01T18:30:00.000Z',
      eventAttendanceMode: 'https://schema.org/MixedEventAttendanceMode',
      image: ['https://club.example.org/api/local-media/dev/poster.webp'],
      offers: { url: event.registrationUrl },
    });
    expect(data?.location).toEqual([
      { '@type': 'Place', name: event.venue, address: siteConfig.parentOrganisation },
      { '@type': 'VirtualLocation', url: event.registrationUrl },
    ]);
  });

  it('leaves out what an event does not have', () => {
    const [bare] = eventsJsonLd(
      [{ ...event, mode: 'offline', registrationUrl: null, poster: null }],
      'https://club.example.org',
    )['@graph'];
    expect(bare).not.toHaveProperty('image');
    expect(bare).not.toHaveProperty('offers');
    expect(bare?.location).toMatchObject({ '@type': 'Place' });
  });
});
