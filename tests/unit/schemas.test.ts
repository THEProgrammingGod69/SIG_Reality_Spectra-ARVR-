import { describe, expect, it } from 'vitest';

import { CATEGORIES, categoryLabel, CategorySchema } from '@/lib/schemas/category';
import {
  EventInputSchema,
  eventEndsAt,
  eventPhase,
  EventSchema,
  MAX_EVENT_PHOTOS,
} from '@/lib/schemas/event';
import { instant, mediaUrl, text } from '@/lib/schemas/fields';
import { GalleryPhotoInputSchema } from '@/lib/schemas/gallery';
import { RecruitmentInputSchema, RecruitmentSettingsSchema } from '@/lib/schemas/recruitment';
import { SponsorshipFormSchema, SponsorshipRequestSchema } from '@/lib/schemas/sponsorship';
import { initialsOf, TeamMemberInputSchema } from '@/lib/schemas/team';
import { uploadFolder, UploadRequestSchema } from '@/lib/schemas/upload';

/**
 * One schema per admin-editable entity (rule 3): the admin form, the Server
 * Action, the stored record and every read use these. Each gets a valid case
 * and the invalid cases that would break a page.
 */

const ID = '44444444-4444-4444-8444-444444444444';
const image = {
  url: 'https://media.example.org/x.webp',
  alt: 'Students at a headset demo',
  width: 1600,
  height: 900,
};
const system = {
  createdAt: '2026-10-01T10:00:00.000Z',
  updatedAt: '2026-10-01T10:00:00.000Z',
  updatedBy: 'admin@vit.edu',
};
const fails = (result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) =>
  result.success ? [] : result.error!.issues.map((issue) => issue.path.join('.'));

describe('shared fields', () => {
  it('stores times normalised to UTC', () => {
    expect(instant.parse('2026-10-10T18:00:00+05:30')).toBe('2026-10-10T12:30:00.000Z');
    expect(instant.safeParse('10 October 2026').success).toBe(false);
  });

  it('accepts uploaded-file URLs from R2 or the local data mode route, and nothing else', () => {
    expect(mediaUrl.safeParse('https://media.example.org/prod/gallery/x.webp').success).toBe(true);
    expect(mediaUrl.safeParse('/api/local-media/dev/gallery/abc/x.webp').success).toBe(true);
    expect(mediaUrl.safeParse('/api/local-media/../../.env.local').success).toBe(false);
    expect(mediaUrl.safeParse('/elsewhere/x.webp').success).toBe(false);
    expect(mediaUrl.safeParse('http://media.example.org/x.webp').success).toBe(false);
  });
});

describe('Category', () => {
  it('is the one list shared by events and gallery photos (D-026)', () => {
    expect(CATEGORIES.map((category) => category.id)).toEqual([
      'hackathon',
      'competition',
      'workshop',
      'other',
    ]);
    expect(CategorySchema.safeParse('meetup').success).toBe(false);
    expect(categoryLabel('competition')).toBe('Competitions');
  });
});

describe('Event', () => {
  const valid = {
    id: ID,
    title: 'XR Build Night',
    category: 'hackathon',
    summary: 'An overnight build sprint for AR and VR prototypes.',
    startsAt: '2026-10-10T18:00:00+05:30',
    venue: 'VIT Pune',
    mode: 'offline',
  };

  it('accepts the minimum and fills safe defaults', () => {
    expect(EventInputSchema.parse(valid)).toMatchObject({
      description: '',
      endsAt: null,
      registrationUrl: null,
      poster: null,
      published: false,
      recap: '',
      photos: [],
      inTimeline: false,
    });
  });

  it.each([
    ['a 400-character title', { title: 'x'.repeat(400) }, 'title'],
    ['an end before the start', { endsAt: '2026-10-10T17:00:00+05:30' }, 'endsAt'],
    ['a published event with no registration link', { published: true }, 'registrationUrl'],
    [
      'an http registration link',
      { registrationUrl: 'http://vierp.example.org' },
      'registrationUrl',
    ],
    ['the timeline without photos', { inTimeline: true }, 'photos'],
    ['the same photo twice', { photos: [image, image] }, 'photos.1'],
    [
      'too many photos',
      {
        photos: Array.from({ length: MAX_EVENT_PHOTOS + 1 }, (_, i) => ({
          ...image,
          url: `${image.url}?${i}`,
        })),
      },
      'photos',
    ],
    ['a photo without alt text', { photos: [{ ...image, alt: '' }] }, 'photos.0.alt'],
    ['an unknown category', { category: 'meetup' }, 'category'],
    ['a made-up id', { id: '42' }, 'id'],
  ])('refuses %s', (_label, change, path) => {
    expect(fails(EventInputSchema.safeParse({ ...valid, ...change }))).toContain(path);
  });

  it('stores the input plus system fields, with the same rules', () => {
    expect(EventSchema.safeParse({ ...valid, ...system }).success).toBe(true);
    expect(fails(EventSchema.safeParse(valid))).toEqual(
      expect.arrayContaining(['createdAt', 'updatedAt', 'updatedBy']),
    );
    expect(fails(EventSchema.safeParse({ ...valid, ...system, published: true }))).toContain(
      'registrationUrl',
    );
  });

  it('derives phases and the end of a single-day event', () => {
    const event = EventInputSchema.parse(valid);
    expect(eventEndsAt(event).toISOString()).toBe('2026-10-10T18:30:00.000Z');
    expect(eventPhase(event, new Date('2026-10-01'))).toBe('draft');
    expect(eventPhase({ ...event, published: true }, new Date('2026-10-01'))).toBe('current');
    expect(eventPhase(event, new Date('2026-10-11'))).toBe('awaiting');
    expect(eventPhase({ ...event, inTimeline: true }, new Date('2026-10-11'))).toBe('timeline');
  });
});

describe('GalleryPhoto', () => {
  it('needs an image, a category and at most a short caption', () => {
    const valid = { id: ID, image, category: 'workshop' };
    expect(GalleryPhotoInputSchema.parse(valid).caption).toBeNull();
    expect(
      fails(GalleryPhotoInputSchema.safeParse({ ...valid, caption: 'x'.repeat(121) })),
    ).toEqual(['caption']);
    expect(fails(GalleryPhotoInputSchema.safeParse({ ...valid, image: undefined }))).toEqual([
      'image',
    ]);
  });
});

describe('TeamMember', () => {
  const core = { id: ID, name: 'Riya Kulkarni', position: 'President', tier: 'core' };

  it('accepts a core member without a photo', () => {
    expect(TeamMemberInputSchema.parse(core)).toMatchObject({
      photo: null,
      domainId: null,
      order: 0,
    });
  });

  it('ties secretaries, and only secretaries, to a domain (D-027)', () => {
    expect(fails(TeamMemberInputSchema.safeParse({ ...core, tier: 'secretary' }))).toEqual([
      'domainId',
    ]);
    expect(fails(TeamMemberInputSchema.safeParse({ ...core, domainId: 'finance' }))).toEqual([
      'domainId',
    ]);
    expect(
      TeamMemberInputSchema.safeParse({ ...core, tier: 'secretary', domainId: 'finance' }).success,
    ).toBe(true);
  });

  it('lists no coordinators or volunteers', () => {
    expect(fails(TeamMemberInputSchema.safeParse({ ...core, tier: 'volunteer' }))).toEqual([
      'tier',
    ]);
  });

  it('shows the first and last initials when there is no photo', () => {
    expect(initialsOf('Ada Lovelace')).toBe('AL');
    expect(initialsOf('  ada   king  lovelace ')).toBe('AL');
    expect(initialsOf('Arnav')).toBe('A');
    expect(initialsOf('Émile Zola')).toBe('ÉZ');
  });
});

describe('RecruitmentSettings', () => {
  it('cannot be open without a form link, but can be without the PDF', () => {
    expect(fails(RecruitmentInputSchema.safeParse({ open: true }))).toEqual(['formUrl']);
    expect(RecruitmentInputSchema.safeParse({ open: false }).success).toBe(true);
    expect(
      RecruitmentSettingsSchema.safeParse({ open: true, formUrl: 'https://forms.gle/x', ...system })
        .success,
    ).toBe(true);
  });
});

describe('SponsorshipRequest', () => {
  const form = {
    name: 'Asha Rao',
    organisation: 'Immersive Labs',
    email: 'asha@example.com',
    type: 'collaboration',
    message: 'We would like to run a joint workshop on spatial computing.',
  };

  it('lets the public send only the form fields', () => {
    expect(SponsorshipFormSchema.parse({ ...form, status: 'closed', id: ID })).not.toHaveProperty(
      'status',
    );
    expect(fails(SponsorshipFormSchema.safeParse({ ...form, email: 'asha' }))).toEqual(['email']);
    expect(fails(SponsorshipFormSchema.safeParse({ ...form, message: 'x'.repeat(2001) }))).toEqual([
      'message',
    ]);
  });

  it('stores a status that starts as new', () => {
    const stored = SponsorshipRequestSchema.parse({ ...form, id: ID, ...system, updatedBy: null });
    expect(stored.status).toBe('new');
  });
});

describe('UploadRequest', () => {
  it('files each target in its own folder', () => {
    expect(uploadFolder('event-poster', ID)).toBe(`events/${ID}/poster/`);
    expect(uploadFolder('event-photo', ID)).toBe(`events/${ID}/photos/`);
    expect(uploadFolder('gallery-photo', ID)).toBe(`gallery/${ID}/`);
    expect(uploadFolder('member-photo', ID)).toBe(`team/${ID}/`);
    expect(uploadFolder('roles-pdf', null)).toBe('recruitment/');
    expect(() => uploadFolder('event-photo', null)).toThrow(/record id/);
  });

  it('accepts an allowed image within the limit', () => {
    expect(
      UploadRequestSchema.safeParse({
        target: 'event-photo',
        recordId: ID,
        contentType: 'image/avif',
        size: 1,
      }).success,
    ).toBe(true);
  });
});

describe('field messages', () => {
  const message = (schema: ReturnType<typeof text>, value: string) =>
    schema.safeParse(value).error?.issues[0]?.message;

  it('speak to the person filling the form, not in Zod’s words', () => {
    expect(message(text(2, 80), 'A')).toBe('Enter at least 2 characters');
    expect(message(text(1, 120), '   ')).toBe('Required');
    expect(message(text(20, 2000), 'x'.repeat(2001))).toBe('Keep it to 2,000 characters or fewer');
  });
});
