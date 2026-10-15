import { existsSync } from 'node:fs';
import path from 'node:path';

import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import archiveJson from '@/content/archive.json';
import siteJson from '@/content/site.json';
import {
  archive,
  archiveGallery,
  archiveGalleryItem,
  contactInfo,
  domainGroups,
  domainNames,
  domainOptions,
  domains,
  parseContent,
  pendingContent,
  profileUrls,
  siteChannels,
  siteInfo,
  socialLinks,
} from '@/lib/content';
import { type ArchiveEntry, ArchiveSchema } from '@/lib/schemas/archive';
import { ContactInfoSchema, DomainsSchema, SiteInfoSchema } from '@/lib/schemas/content';

/**
 * The Git-edited content: every file validates, the schemas reject what would
 * break a page, and a bad file fails with a message naming file and field.
 */

describe('content files', () => {
  it('all parse (the same check that runs during next build)', () => {
    expect(siteInfo.tagline).toBe(
      'Where technology meets imagination, and ideas become experiences.',
    );
    expect(siteInfo.motto).toBe('Explore. Build. Express.');
    expect(siteInfo.about.long.length).toBeGreaterThan(0);
    expect(domains.length).toBeGreaterThan(0);
    expect(contactInfo.socials.length).toBeGreaterThan(0);
  });

  it('a malformed file fails with the file and field named', () => {
    const broken = { ...siteJson, mission: 'too short' };
    expect(() => parseContent(SiteInfoSchema, broken, 'site.json')).toThrowError(
      /Invalid content in src\/content\/site\.json:\n {2}- mission: /,
    );
  });

  it('reports every problem at once, with nested paths', () => {
    const broken = { ...siteJson, motto: '', about: { short: '', long: [] } };
    const error = (() => {
      try {
        parseContent(SiteInfoSchema, broken, 'site.json');
      } catch (e) {
        return String(e);
      }
    })();
    expect(error).toContain('- motto:');
    expect(error).toContain('- about.short:');
    expect(error).toContain('- about.long:');
  });
});

describe('domains', () => {
  it('are the ten approved domains, numbered 01–10 in brief order', () => {
    const numbered = domainGroups.flatMap((group) => group.domains);
    expect(numbered).toHaveLength(10);
    expect(numbered.map((d) => d.number).sort()).toEqual(
      Array.from({ length: 10 }, (_, i) => String(i + 1).padStart(2, '0')),
    );
  });

  it('split into the confirmed technical and non-technical groups', () => {
    const [technical, nonTechnical] = domainGroups;
    expect(technical?.id).toBe('technical');
    expect(technical?.domains.map((d) => d.id)).toEqual([
      'training-workshops',
      'web-development',
      'xr-development',
    ]);
    expect(nonTechnical?.id).toBe('non-technical');
    expect(nonTechnical?.domains).toHaveLength(7);
  });

  it('reject duplicate ids and bad slugs', () => {
    const domain = {
      id: 'web',
      name: 'Web',
      group: 'technical',
      description: 'A long enough line.',
    };
    expect(DomainsSchema.safeParse([domain, domain]).success).toBe(false);
    expect(DomainsSchema.safeParse([{ ...domain, id: 'Web Dev' }]).success).toBe(false);
    expect(DomainsSchema.safeParse([{ ...domain, group: 'design' }]).success).toBe(false);
  });
});

describe('contact', () => {
  it('holds no placeholder values — unknown details are null', () => {
    const values = [
      contactInfo.email,
      contactInfo.phone,
      contactInfo.address,
      contactInfo.map.url,
      contactInfo.map.embedUrl,
      ...contactInfo.socials.flatMap((s) => [s.href, s.handle]),
    ];
    for (const value of values) {
      if (value !== null) expect(value).not.toMatch(/todo|example|placeholder|coming soon/i);
    }
  });

  it('links the club Instagram without a share-tracking query', () => {
    const instagram = socialLinks.find((s) => s.id === 'instagram');
    expect(instagram?.href).toBe('https://www.instagram.com/sig_realityspectra/');
    expect(instagram?.href).not.toContain('?');
  });

  it('never links the private site repository (D-014)', () => {
    for (const social of contactInfo.socials) {
      expect(social.href ?? '').not.toContain('SIG_Reality_Spectra-ARVR-');
    }
  });

  it('exposes only the channels that are set, and no invite link as a profile', () => {
    expect(socialLinks.every((s) => s.href.startsWith('https://'))).toBe(true);
    expect(siteChannels.socials).toHaveLength(socialLinks.length);
    expect(profileUrls.some((url) => url.includes('chat.whatsapp.com'))).toBe(false);
  });

  it('rejects http links, bad emails and non-Google map embeds', () => {
    const valid = ContactInfoSchema.parse(contactInfo);
    expect(ContactInfoSchema.safeParse({ ...valid, email: 'not-an-email' }).success).toBe(false);
    expect(
      ContactInfoSchema.safeParse({
        ...valid,
        map: { url: null, embedUrl: 'https://example.com/embed' },
      }).success,
    ).toBe(false);
    expect(
      ContactInfoSchema.safeParse({
        ...valid,
        socials: [{ ...valid.socials[0]!, href: 'http://instagram.com/x' }],
      }).success,
    ).toBe(false);
  });

  it('lists the details still shown as "Coming soon"', () => {
    for (const field of ['email', 'phone', 'address', 'map.url'] as const) {
      const value =
        field === 'map.url'
          ? contactInfo.map.url
          : contactInfo[field as 'email' | 'phone' | 'address'];
      expect(pendingContent().includes(`contact.json: ${field}`)).toBe(value === null);
    }
  });
});

type Clip = Extract<ArchiveEntry, { kind: 'video' }>;

describe('archive', () => {
  const file = (servedPath: string) => path.join(process.cwd(), 'public', servedPath);

  it('parses, with photos and clips under the gallery categories', () => {
    expect(archive.length).toBe(archiveJson.length);
    expect(archive.some((entry) => entry.kind === 'photo')).toBe(true);
    expect(archive.some((entry) => entry.kind === 'video')).toBe(true);
  });

  it('a broken entry fails with the file and field named', () => {
    const broken = [{ ...archiveJson[1]!, caption: '' }, ...archiveJson.slice(2)];
    expect(() => parseContent(ArchiveSchema, broken, 'archive.json')).toThrowError(
      /Invalid content in src\/content\/archive\.json:\n {2}- 0\.caption: /,
    );
  });

  it('names only files that exist under public/', () => {
    for (const entry of archive) {
      expect(existsSync(file(entry.src)), entry.src).toBe(true);
      if (entry.kind === 'video') expect(existsSync(file(entry.poster)), entry.poster).toBe(true);
    }
  });

  it('gives every clip a poster and a length', () => {
    for (const entry of archive.filter((item) => item.kind === 'video')) {
      expect(entry.poster, entry.src).toMatch(/\.(webp|jpg|png|avif)$/);
      expect(entry.duration, entry.src).toBeGreaterThan(0);
    }
  });

  it('records each photo’s (and each poster’s) real size, so the viewer reserves the right space', async () => {
    for (const entry of archive) {
      const still = entry.kind === 'video' ? entry.poster : entry.src;
      const { width, height } = await sharp(file(still)).metadata();
      expect({ width, height }, still).toEqual({ width: entry.width, height: entry.height });
    }
  });

  it('becomes gallery items keyed by file, a clip shown by its poster', () => {
    expect(archiveGallery).toHaveLength(archive.length);
    const clip = archive.find((entry): entry is Clip => entry.kind === 'video')!;
    expect(archiveGalleryItem(clip)).toMatchObject({
      key: `archive:${clip.src}`,
      image: { url: clip.poster, alt: clip.alt },
      video: { src: clip.src, duration: clip.duration },
      source: { kind: 'archive' },
    });
    const photo = archive.find((entry) => entry.kind === 'photo')!;
    expect(archiveGalleryItem(photo)).toMatchObject({
      image: { url: photo.src },
      video: null,
      album: photo.album ?? null,
      credit: photo.credit ?? null,
    });
    expect(new Set(archiveGallery.map((item) => item.key)).size).toBe(archive.length);
  });
});

describe('domain helpers', () => {
  it('names every domain, in domains.json order', () => {
    expect(domainOptions.map((domain) => domain.id)).toEqual(domains.map((domain) => domain.id));
    for (const domain of domains) expect(domainNames[domain.id]).toBe(domain.name);
  });
});
