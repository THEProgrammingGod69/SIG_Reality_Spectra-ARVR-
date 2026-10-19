import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConflictError, InvalidDataError, MediaError, NotFoundError } from '@/lib/data/errors';
import { splitByPhase } from '@/lib/data/events';
import type { EventInput } from '@/lib/schemas/event';

import { ADMIN, createHarness, DAY, type Harness, MEDIA_ORIGIN, NAMESPACE } from './harness';

const ID = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';

function draft(overrides: Partial<EventInput> = {}): EventInput {
  return {
    id: ID,
    title: 'XR Build Night',
    category: 'hackathon',
    summary: 'An overnight build sprint for AR and VR prototypes.',
    startsAt: '2026-10-10T18:00:00+05:30',
    endsAt: '2026-10-11T08:00:00+05:30',
    venue: 'VIT Pune, Main Building',
    mode: 'offline',
    ...overrides,
  };
}

describe('events repository', () => {
  let h: Harness;
  beforeEach(() => {
    h = createHarness('2026-10-01T10:00:00.000Z');
  });

  it('creates a draft, stamps it, and refreshes the events tag', async () => {
    const event = await h.events.create(draft(), ADMIN);

    expect(event).toMatchObject({
      published: false,
      inTimeline: false,
      photos: [],
      startsAt: '2026-10-10T12:30:00.000Z',
      createdAt: '2026-10-01T10:00:00.000Z',
      updatedAt: '2026-10-01T10:00:00.000Z',
      updatedBy: ADMIN,
    });
    expect(await h.events.get(ID)).toEqual(event);
    expect(h.invalidated).toEqual([['events']]);
  });

  it('rejects invalid input with field-level issues and writes nothing', async () => {
    const error = await h.events
      .create(draft({ title: 'X', published: true }), ADMIN)
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(InvalidDataError);
    // A registration link is optional, even when published (D-041).
    expect((error as InvalidDataError).issues.map((issue) => issue.path)).toEqual(['title']);
    expect(h.store.size()).toBe(0);
    expect(h.invalidate).not.toHaveBeenCalled();
  });

  it('derives phases from the time of the request (rule 12)', async () => {
    await h.events.create(
      draft({ published: true, registrationUrl: 'https://vierp.example.org/register/42' }),
      ADMIN,
    );
    const events = await h.events.listPublic();

    const at = (iso: string) => splitByPhase(events, new Date(iso));
    expect(at('2026-10-05T00:00:00Z').current).toHaveLength(1);
    expect(at('2026-10-10T20:00:00Z').current).toHaveLength(1);
    // Ended and not on the timeline: "awaiting", which the public never sees.
    expect(at('2026-10-12T00:00:00Z')).toEqual({ current: [], timeline: [] });
  });

  it('keeps drafts off the public list', async () => {
    await h.events.create(draft(), ADMIN);
    expect(await h.events.listPublic()).toEqual([]);
  });

  describe('the timeline', () => {
    it('refuses an event that has not ended', async () => {
      const photo = await h.image('event-photo', ID);
      const error = await h.events
        .create(draft({ photos: [photo], inTimeline: true }), ADMIN)
        .catch((caught: unknown) => caught);
      expect(error).toBeInstanceOf(InvalidDataError);
      expect((error as InvalidDataError).issues[0]?.path).toBe('inTimeline');
    });

    it('accepts an ended event without photos (D-041)', async () => {
      h.tick(30 * DAY);
      await h.events.create(draft({ inTimeline: true }), ADMIN);
      const { timeline } = splitByPhase(
        await h.events.listPublic(),
        new Date('2026-10-31T10:00:00Z'),
      );
      expect(timeline.map((event) => event.id)).toEqual([ID]);
    });

    it('puts an ended event on the timeline with a one-field update', async () => {
      const created = await h.events.create(draft({ published: true }), ADMIN);
      await expect(
        h.events.update(ID, created.updatedAt, { inTimeline: true }, ADMIN),
      ).rejects.toBeInstanceOf(InvalidDataError);

      h.tick(30 * DAY);
      const moved = await h.events.update(ID, created.updatedAt, { inTimeline: true }, ADMIN);
      expect(moved).toMatchObject({ inTimeline: true, title: created.title, published: true });
    });

    it('accepts an ended event with photos, newest first', async () => {
      h.tick(30 * DAY);
      const photo = await h.image('event-photo', ID);
      await h.events.create(
        draft({ photos: [photo], inTimeline: true, recap: 'Twelve teams.' }),
        ADMIN,
      );
      const older = await h.image('event-photo', OTHER);
      await h.events.create(
        draft({
          id: OTHER,
          startsAt: '2026-09-01T10:00:00+05:30',
          endsAt: null,
          photos: [older],
          inTimeline: true,
        }),
        ADMIN,
      );

      const { timeline } = splitByPhase(await h.events.listPublic(), h.clock.now);
      expect(timeline.map((event) => event.id)).toEqual([ID, OTHER]);
    });
  });

  describe('updates', () => {
    it('changes only the given fields and moves the version forward', async () => {
      const created = await h.events.create(draft(), ADMIN);
      const updated = await h.events.update(
        ID,
        created.updatedAt,
        { venue: 'Online' },
        'second@vit.edu',
      );

      expect(updated).toMatchObject({
        venue: 'Online',
        title: created.title,
        updatedBy: 'second@vit.edu',
      });
      expect(updated.createdAt).toBe(created.createdAt);
      // Same millisecond as the create, yet a different version.
      expect(updated.updatedAt > created.updatedAt).toBe(true);
      expect(h.invalidated).toEqual([['events'], ['events']]);
    });

    it('treats an undefined field as unchanged and null as cleared', async () => {
      const poster = await h.image('event-poster', ID);
      const created = await h.events.create(draft({ poster }), ADMIN);

      const kept = await h.events.update(ID, created.updatedAt, { poster: undefined }, ADMIN);
      expect(kept.poster).toEqual(poster);
      const cleared = await h.events.update(ID, kept.updatedAt, { poster: null }, ADMIN);
      expect(cleared.poster).toBeNull();
      expect(await h.media.listKeys()).toEqual([]);
    });

    it('rejects a stale edit instead of overwriting someone else’s change', async () => {
      const created = await h.events.create(draft(), ADMIN);
      await h.events.update(ID, created.updatedAt, { venue: 'Hall A' }, ADMIN);

      await expect(
        h.events.update(ID, created.updatedAt, { venue: 'Hall B' }, ADMIN),
      ).rejects.toBeInstanceOf(ConflictError);
      expect((await h.events.get(ID))?.venue).toBe('Hall A');
    });

    it('reports a deleted record as not found', async () => {
      await expect(h.events.update(ID, 'x', { venue: 'Hall' }, ADMIN)).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });

    it('never lets an update change the id', async () => {
      const created = await h.events.create(draft(), ADMIN);
      await expect(
        h.events.update(ID, created.updatedAt, { id: OTHER }, ADMIN),
      ).rejects.toBeInstanceOf(InvalidDataError);
    });
  });

  describe('files', () => {
    it('deletes the old poster when it is replaced, and every file on delete', async () => {
      const first = await h.image('event-poster', ID);
      const created = await h.events.create(draft({ poster: first }), ADMIN);
      const second = await h.image('event-poster', ID);
      const updated = await h.events.update(ID, created.updatedAt, { poster: second }, ADMIN);

      expect(await h.media.listKeys()).toHaveLength(1);
      expect(updated.poster?.url).toBe(second.url);

      await h.events.remove(ID, updated.updatedAt);
      expect(await h.media.listKeys()).toEqual([]);
      expect(await h.events.get(ID)).toBeNull();
      expect(h.store.size()).toBe(0);
    });

    it('refuses a file from outside our storage', async () => {
      const poster = {
        url: 'https://elsewhere.example.com/x.webp',
        alt: 'Poster art',
        width: 10,
        height: 10,
      };
      await expect(h.events.create(draft({ poster }), ADMIN)).rejects.toBeInstanceOf(MediaError);
    });

    it('refuses a file uploaded for another event, or as another field', async () => {
      const othersPhoto = await h.image('event-photo', OTHER);
      await expect(h.events.create(draft({ photos: [othersPhoto] }), ADMIN)).rejects.toThrow(
        /different record/,
      );
      const poster = await h.image('event-poster', ID);
      await expect(h.events.create(draft({ photos: [poster] }), ADMIN)).rejects.toThrow(
        /different record/,
      );
    });

    it('refuses an upload that never finished', async () => {
      const ticket = await h.media.createUpload({
        target: 'event-poster',
        recordId: ID,
        contentType: 'image/webp',
        size: 10,
      });
      const poster = { url: ticket.url, alt: 'Poster art', width: 10, height: 10 };
      await expect(h.events.create(draft({ poster }), ADMIN)).rejects.toThrow(/did not finish/);
    });

    it('removes an oversized upload when it is attached', async () => {
      const url = await h.upload('event-poster', ID, { uploadedSize: 50 * 1024 * 1024 });
      const poster = { url, alt: 'Poster art', width: 10, height: 10 };

      await expect(h.events.create(draft({ poster }), ADMIN)).rejects.toThrow(/larger than 5 MB/);
      expect(await h.media.listKeys()).toEqual([]);
    });

    it('does not re-check files the record already had', async () => {
      const poster = await h.image('event-poster', ID);
      const created = await h.events.create(draft({ poster }), ADMIN);
      const verify = vi.spyOn(h.media, 'verify');

      await h.events.update(ID, created.updatedAt, { venue: 'Hall C' }, ADMIN);
      expect(verify).not.toHaveBeenCalled();
    });

    it('files every upload under this deployment’s namespace', async () => {
      const url = await h.upload('event-photo', ID);
      expect(url.startsWith(`${MEDIA_ORIGIN}/${NAMESPACE}/events/${ID}/photos/`)).toBe(true);
    });
  });

  describe('corrupt data', () => {
    it('treats a record that does not exist as absent, without logging', async () => {
      const log = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(await h.events.get(OTHER)).toBeNull();
      expect(log).not.toHaveBeenCalled();
    });

    it('is logged and skipped, never thrown at a public page', async () => {
      await h.events.create(draft(), ADMIN);
      await h.events.create(draft({ id: OTHER }), ADMIN);
      h.store.corrupt('event', OTHER, '{"title": 42}');
      const log = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect((await h.events.list()).map((event) => event.id)).toEqual([ID]);
      expect(await h.events.get(OTHER)).toBeNull();
      expect(log).toHaveBeenCalledWith(
        expect.stringContaining('failed validation'),
        expect.anything(),
      );

      h.store.corrupt('event', ID, 'not json');
      expect(await h.events.list()).toEqual([]);
      expect(log).toHaveBeenCalledWith(expect.stringContaining('not valid JSON'));
    });
  });
});

describe('splitByPhase', () => {
  const event = (startsAt: string, extra: object = {}) => ({
    startsAt,
    endsAt: null,
    published: true,
    inTimeline: false,
    ...extra,
  });

  it('orders current events soonest first', () => {
    const now = new Date('2026-10-01T00:00:00Z');
    const { current } = splitByPhase(
      [event('2026-10-20T10:00:00.000Z'), event('2026-10-05T10:00:00.000Z')],
      now,
    );
    expect(current.map((entry) => entry.startsAt)).toEqual([
      '2026-10-05T10:00:00.000Z',
      '2026-10-20T10:00:00.000Z',
    ]);
  });

  it('keeps a same-day event current until the end of its day in India', () => {
    const talk = event('2026-10-05T04:30:00.000Z'); // 10:00 IST
    expect(splitByPhase([talk], new Date('2026-10-05T18:29:00Z')).current).toHaveLength(1); // 23:59 IST
    expect(splitByPhase([talk], new Date('2026-10-05T18:30:00Z')).current).toHaveLength(0); // midnight
  });
});
