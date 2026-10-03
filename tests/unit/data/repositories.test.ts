import { beforeEach, describe, expect, it } from 'vitest';

import {
  AlreadyExistsError,
  ConflictError,
  InvalidDataError,
  RateLimitedError,
} from '@/lib/data/errors';
import { buildGallery } from '@/lib/data/gallery';
import { SUBMISSION_LIMIT } from '@/lib/data/sponsorships';
import { groupTeam } from '@/lib/data/team';
import type { TeamMemberInput } from '@/lib/schemas/team';

import { ADMIN, createHarness, DAY, DOMAIN_IDS, type Harness } from './harness';

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

let h: Harness;
beforeEach(() => {
  h = createHarness();
});

describe('gallery', () => {
  it('adds a standalone photo, refreshing only the gallery tag', async () => {
    const image = await h.image('gallery-photo', id(1));
    const photo = await h.gallery.create({ id: id(1), image, category: 'other' }, ADMIN);

    expect(photo).toMatchObject({ caption: null, category: 'other' });
    expect(h.invalidated).toEqual([['gallery']]);
  });

  it('deletes the file with the photo', async () => {
    const image = await h.image('gallery-photo', id(1));
    const photo = await h.gallery.create({ id: id(1), image, category: 'workshop' }, ADMIN);
    await h.gallery.remove(id(1), photo.updatedAt);

    expect(await h.media.listKeys()).toEqual([]);
    expect(await h.gallery.count()).toBe(0);
  });

  it('shows timeline event photos and club photos together, newest first', async () => {
    h.tick(60 * DAY);
    const eventPhoto = await h.image('event-photo', id(10));
    await h.events.create(
      {
        id: id(10),
        title: 'Spectra Hack',
        category: 'hackathon',
        summary: 'Thirty-six hours of building for headsets.',
        startsAt: '2026-10-20T09:00:00Z',
        venue: 'VIT Pune',
        mode: 'offline',
        photos: [eventPhoto],
        inTimeline: true,
      },
      ADMIN,
    );
    await h.events.create(
      {
        id: id(11),
        title: 'Still a draft',
        category: 'workshop',
        summary: 'Draft events never reach the gallery.',
        startsAt: '2026-10-25T09:00:00Z',
        venue: 'VIT Pune',
        mode: 'offline',
        photos: [await h.image('event-photo', id(11))],
      },
      ADMIN,
    );
    const clubImage = await h.image('gallery-photo', id(20));
    await h.gallery.create(
      { id: id(20), image: clubImage, category: 'other', caption: 'Lab day' },
      ADMIN,
    );

    const items = buildGallery(await h.events.listPublic(), await h.gallery.list());
    expect(items.map((item) => [item.category, item.source.kind])).toEqual([
      ['other', 'club'],
      ['hackathon', 'event'],
    ]);
    expect(items[1]?.source).toEqual({
      kind: 'event',
      eventId: id(10),
      eventTitle: 'Spectra Hack',
    });
  });

  it('drops an event’s photos when it leaves the timeline', () => {
    const photo = { url: 'https://media.example.org/x.webp', alt: 'A photo', width: 4, height: 3 };
    const event = {
      id: id(1),
      title: 'Talk',
      category: 'other' as const,
      startsAt: '2026-01-01T00:00:00.000Z',
      photos: [photo],
    };
    expect(buildGallery([{ ...event, inTimeline: true }], [])).toHaveLength(1);
    expect(buildGallery([{ ...event, inTimeline: false }], [])).toHaveLength(0);
  });
});

describe('team', () => {
  const member = (n: number, overrides: Partial<TeamMemberInput> = {}): TeamMemberInput => ({
    id: id(n),
    name: `Member ${n}`,
    position: 'President',
    tier: 'core',
    ...overrides,
  });

  it('requires a secretary’s domain to be one of the club’s', async () => {
    await expect(
      h.team.create(member(1, { tier: 'secretary', position: 'Secretary' }), ADMIN),
    ).rejects.toBeInstanceOf(InvalidDataError);
    await expect(
      h.team.create(member(1, { tier: 'secretary', domainId: 'no-such-domain' }), ADMIN),
    ).rejects.toThrow(/club’s domains/);
    await expect(h.team.create(member(1, { domainId: 'finance' }), ADMIN)).rejects.toBeInstanceOf(
      InvalidDataError,
    );

    const secretary = await h.team.create(
      member(1, { tier: 'secretary', domainId: 'finance' }),
      ADMIN,
    );
    expect(secretary.domainId).toBe('finance');
    expect(h.invalidated).toEqual([['team']]);
  });

  it('reorders atomically: a stale member fails the whole reorder', async () => {
    const a = await h.team.create(member(1, { order: 0 }), ADMIN);
    const b = await h.team.create(member(2, { order: 1 }), ADMIN);
    await h.team.update(b.id, b.updatedAt, { name: 'Renamed' }, ADMIN);

    await expect(
      h.team.reorder(
        [
          { id: b.id, expectedUpdatedAt: b.updatedAt },
          { id: a.id, expectedUpdatedAt: a.updatedAt },
        ],
        ADMIN,
      ),
    ).rejects.toBeInstanceOf(ConflictError);
    expect((await h.team.get(a.id))?.order).toBe(0);

    const fresh = (await h.team.get(b.id))!;
    await h.team.reorder(
      [
        { id: b.id, expectedUpdatedAt: fresh.updatedAt },
        { id: a.id, expectedUpdatedAt: a.updatedAt },
      ],
      ADMIN,
    );
    expect((await h.team.list()).map((entry) => entry.id)).toEqual([b.id, a.id]);
  });

  it('lists core members first, then secretaries in domain order', async () => {
    await h.team.create(member(1, { tier: 'secretary', domainId: 'finance' }), ADMIN);
    await h.team.create(member(2, { tier: 'secretary', domainId: 'xr-development' }), ADMIN);
    await h.team.create(member(3, { order: 1, position: 'Vice President' }), ADMIN);
    await h.team.create(member(4, { order: 0 }), ADMIN);

    const { core, secretaries } = groupTeam(await h.team.list(), DOMAIN_IDS);
    expect(core.map((entry) => entry.id)).toEqual([id(4), id(3)]);
    expect(secretaries.map((entry) => entry.domainId)).toEqual(['xr-development', 'finance']);
  });

  it('adds a new member at the end of their tier', async () => {
    await h.team.create(member(1, { order: 4 }), ADMIN);
    await h.team.create(member(2, { tier: 'secretary', domainId: 'finance', order: 9 }), ADMIN);

    const added = await h.team.append(member(3, { order: 0 }), ADMIN);
    expect(added.order).toBe(5);
    const first = await h.team.append(
      member(4, { tier: 'secretary', domainId: 'xr-development' }),
      ADMIN,
    );
    expect(first.order).toBe(10);
  });

  it('replaces a photo and deletes the old file', async () => {
    const first = await h.image('member-photo', id(1));
    const created = await h.team.create(member(1, { photo: first }), ADMIN);
    const second = await h.image('member-photo', id(1));
    await h.team.update(id(1), created.updatedAt, { photo: second }, ADMIN);

    expect(await h.media.listKeys()).toEqual([
      second.url.slice('https://media.example.org/'.length),
    ]);
  });
});

describe('recruitment', () => {
  it('is closed before an admin has saved anything', async () => {
    expect(await h.recruitment.get()).toBeNull();
    expect(await h.recruitment.getStatus()).toEqual({
      open: false,
      formUrl: null,
      rolesPdfUrl: null,
    });
  });

  it('can open with only the form link; the PDF comes later (D-028)', async () => {
    const saved = await h.recruitment.save(
      { open: true, formUrl: 'https://forms.gle/example' },
      null,
      ADMIN,
    );
    expect(await h.recruitment.getStatus()).toEqual({
      open: true,
      formUrl: 'https://forms.gle/example',
      rolesPdfUrl: null,
    });
    expect(h.invalidated).toEqual([['recruitment']]);

    const pdf = await h.upload('roles-pdf', null);
    const withPdf = await h.recruitment.save(
      { open: true, formUrl: 'https://forms.gle/example', rolesPdfUrl: pdf },
      saved.updatedAt,
      ADMIN,
    );
    const newPdf = await h.upload('roles-pdf', null);
    await h.recruitment.save(
      { open: true, formUrl: 'https://forms.gle/example', rolesPdfUrl: newPdf },
      withPdf.updatedAt,
      ADMIN,
    );
    expect(await h.media.listKeys()).toEqual([newPdf.slice('https://media.example.org/'.length)]);
  });

  it('cannot open without a form link', async () => {
    await expect(h.recruitment.save({ open: true }, null, ADMIN)).rejects.toBeInstanceOf(
      InvalidDataError,
    );
  });

  it('refuses a second "first save" from a stale form', async () => {
    await h.recruitment.save({ open: false }, null, ADMIN);
    await expect(h.recruitment.save({ open: false }, null, ADMIN)).rejects.toBeInstanceOf(
      AlreadyExistsError,
    );
  });

  it('only accepts a PDF as the roles document', async () => {
    const image = await h
      .upload('roles-pdf', null, { contentType: 'image/webp' })
      .catch((error: unknown) => error);
    expect(image).toBeInstanceOf(InvalidDataError);
  });
});

describe('sponsorship requests', () => {
  const form = {
    name: 'Asha Rao',
    organisation: 'Immersive Labs',
    email: 'asha@example.com',
    type: 'sponsorship' as const,
    message: 'We would like to sponsor your next hackathon.',
  };

  it('assigns the id and status itself, whatever the form sends', async () => {
    const crafted = { ...form, id: id(99), status: 'closed' } as typeof form;
    const request = await h.sponsorships.submit(crafted);

    expect(request.id).not.toBe(id(99));
    expect(request).toMatchObject({ status: 'new', updatedBy: null, phone: null });
  });

  it('is never cached, so a submission refreshes no tag', async () => {
    await h.sponsorships.submit(form);
    expect(h.invalidated).toEqual([[]]);
  });

  it('lists newest first, a page at a time, and tracks status', async () => {
    const first = await h.sponsorships.submit(form);
    h.tick(1000);
    const second = await h.sponsorships.submit({ ...form, name: 'Second Sender' });

    expect((await h.sponsorships.list()).map((request) => request.id)).toEqual([
      second.id,
      first.id,
    ]);
    expect(
      (await h.sponsorships.list({ offset: 1, limit: 1 })).map((request) => request.id),
    ).toEqual([first.id]);

    const contacted = await h.sponsorships.setStatus(first.id, first.updatedAt, 'contacted', ADMIN);
    expect(contacted).toMatchObject({
      status: 'contacted',
      updatedBy: ADMIN,
      message: form.message,
    });
  });

  it('rejects a short message', async () => {
    await expect(h.sponsorships.submit({ ...form, message: 'Hi' })).rejects.toBeInstanceOf(
      InvalidDataError,
    );
  });

  it('limits each sender, counting only valid requests (D-032)', async () => {
    const from = '203.0.113.7';
    // An invalid request is refused before it uses up an attempt.
    await expect(
      h.sponsorships.submit({ ...form, message: 'Hi' }, { from }),
    ).rejects.toBeInstanceOf(InvalidDataError);
    for (let sent = 0; sent < SUBMISSION_LIMIT.requests; sent += 1) {
      await h.sponsorships.submit(form, { from });
    }
    await expect(h.sponsorships.submit(form, { from })).rejects.toBeInstanceOf(RateLimitedError);
    expect(await h.sponsorships.count()).toBe(SUBMISSION_LIMIT.requests);

    // Another sender is unaffected, and the address itself is never stored.
    await h.sponsorships.submit(form, { from: '198.51.100.1' });
    expect(JSON.stringify(h.store.snapshot())).not.toContain(from);
  });
});
