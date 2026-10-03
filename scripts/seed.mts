/**
 * pnpm seed --demo
 *
 * Fills the data store this checkout's `.env.local` points at (its
 * DATA_BACKEND and DATA_NAMESPACE) with clearly labelled "[Demo]" content
 * until the club's real content arrives (D-031): events (current, draft,
 * ended, on the timeline, one at every length limit), club photos, team
 * members (with and without a photo), a sponsorship request, and recruitment
 * open with the club's form link if no admin has saved the settings yet.
 * Placeholder images come in mixed aspect ratios. Refused in the production
 * namespace, where everything is entered in the admin panel.
 *
 * Safe to run any number of times: it only ever creates records that do not
 * exist yet, and never edits or deletes one. Changes made here bypass the
 * admin panel, so the running site shows them within an hour (the public
 * reads' cache lifetime), or at once after a restart.
 */
import { existsSync, readFileSync } from 'node:fs';

import type { EventInput } from '@/lib/schemas/event';

// Load the environment before anything reads it (src/lib/env.ts parses on import).
if (existsSync('.env.local')) process.loadEnvFile('.env.local');

if (!process.argv.includes('--demo')) {
  console.log('Usage: pnpm seed --demo   (adds labelled demo content; never in "prod")');
  process.exit(1);
}

const { domains } = await import('@/lib/content');
const { createDataServices } = await import('@/lib/data/runtime');
const { CATEGORIES } = await import('@/lib/schemas/category');

const SEED_ACTOR = 'seed-script@reality-spectra.invalid';
const DAY = 24 * 60 * 60 * 1000;
/** The club's application form (supplied Oct 2026, OPEN_ITEMS #20). */
const CLUB_FORM_URL = 'https://forms.gle/WoDyL1mwWHnnKFs38';

const data = createDataServices({ invalidate: () => {} });
const summary: string[] = [];

/** Create a record unless one with its id exists; files are made only when it does not. */
async function ensure(
  label: string,
  exists: () => Promise<unknown>,
  create: () => Promise<unknown>,
) {
  if ((await exists()) !== null) {
    summary.push(`exists   ${label}`);
    return;
  }
  await create();
  summary.push(`created  ${label}`);
}

if (data.namespace === 'prod') {
  throw new Error('Demo data is never written to the production namespace.');
}
console.log(`Seeding namespace "${data.namespace}" with demo data…`);

if ((await data.recruitment.get()) === null) {
  await data.recruitment.save(
    { open: true, formUrl: CLUB_FORM_URL, rolesPdfUrl: null },
    null,
    SEED_ACTOR,
  );
  summary.push('created  recruitment settings (open, with the club’s form link)');
} else {
  summary.push('exists   recruitment settings (left alone)');
}

await seedDemo();

console.log(summary.map((line) => `  ${line}`).join('\n'));
console.log('Done.');

/* -------------------------------------------------------------------------- */
/* Demo data                                                                  */
/* -------------------------------------------------------------------------- */

async function seedDemo() {
  const { default: sharp } = await import('sharp');

  // The image colours come from the design tokens, so the placeholders match the site.
  const css = readFileSync('src/app/globals.css', 'utf8');
  const token = (name: string) => {
    const value = new RegExp(`--color-${name}:\\s*(#[0-9a-f]{6})`, 'i').exec(css)?.[1];
    if (!value) throw new Error(`Token --color-${name} not found in globals.css`);
    return value;
  };
  const spectrum = ['magenta', 'violet', 'indigo', 'azure', 'cyan', 'orchid'].map((name) =>
    token(`spectra-${name}`),
  );
  const [background, ink] = [token('bg'), token('text')];

  /** The shapes the club's photos come in. */
  const RATIOS = [
    { label: '4:5', width: 1080, height: 1350 },
    { label: '16:9', width: 1600, height: 900 },
    { label: '1:1', width: 1200, height: 1200 },
    { label: '9:16', width: 900, height: 1600 },
    { label: '4:3', width: 1600, height: 1200 },
    { label: '5:4', width: 1350, height: 1080 },
  ] as const;
  let painted = 0;

  /** A placeholder image: spectrum gradient, its label and shape written on it. */
  async function placeholder(label: string, ratioIndex: number) {
    const ratio = RATIOS[ratioIndex % RATIOS.length]!;
    const from = spectrum[painted % spectrum.length]!;
    const to = spectrum[(painted + 2) % spectrum.length]!;
    painted += 1;
    const size = Math.round(Math.min(ratio.width, ratio.height) / 14);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${ratio.width}" height="${ratio.height}">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>
      </linearGradient></defs>
      <rect width="100%" height="100%" fill="${background}"/>
      <rect width="100%" height="100%" fill="url(#g)" opacity="0.6"/>
      <text x="50%" y="47%" text-anchor="middle" font-family="sans-serif" font-size="${size}" fill="${ink}">${label}</text>
      <text x="50%" y="58%" text-anchor="middle" font-family="monospace" font-size="${Math.round(size * 0.6)}" fill="${ink}" opacity="0.8">DEMO · ${ratio.label}</text>
    </svg>`;
    const body = new Uint8Array(await sharp(Buffer.from(svg)).webp({ quality: 70 }).toBuffer());
    return { body, width: ratio.width, height: ratio.height };
  }

  async function upload(
    target: 'event-poster' | 'event-photo' | 'gallery-photo' | 'member-photo',
    recordId: string,
    label: string,
    ratioIndex: number,
    alt: string,
  ) {
    const image = await placeholder(label, ratioIndex);
    const url = await data.media.putFile(target, recordId, image.body, 'image/webp');
    return { url, alt, width: image.width, height: image.height };
  }

  async function photos(eventId: string, title: string, count: number, firstRatio: number) {
    const list = [];
    for (let index = 0; index < count; index += 1) {
      list.push(
        await upload(
          'event-photo',
          eventId,
          `Photo ${index + 1}`,
          firstRatio + index,
          `Demo photo ${index + 1} from ${title}`,
        ),
      );
    }
    return list;
  }

  const at = (days: number) => new Date(Date.now() + days * DAY).toISOString();
  // Fixed ids, so a second run finds the same records and skips them.
  const demoId = (n: number) => `de300000-0000-4000-8000-${String(n).padStart(12, '0')}`;
  // A placeholder until real events exist: the recruitment form stands in (D-031).
  const registrationUrl = CLUB_FORM_URL;
  const base = {
    description:
      'Demo data, created by pnpm seed --demo while the real event details are being finalised.\n\nReplace or delete it from the admin panel at any time.',
    venue: 'VIT Pune',
    mode: 'offline',
  } as const;

  const events: { id: string; label: string; make: () => Promise<EventInput> }[] = [
    {
      id: demoId(1),
      label: 'demo event (current, with poster)',
      make: async () => ({
        ...base,
        id: demoId(1),
        title: '[Demo] XR Build Night',
        category: 'hackathon',
        summary: 'An overnight build sprint for AR and VR prototypes. Sample event.',
        startsAt: at(14),
        endsAt: at(15),
        published: true,
        registrationUrl,
        poster: await upload(
          'event-poster',
          demoId(1),
          'XR Build Night',
          0,
          'Demo poster for XR Build Night',
        ),
      }),
    },
    {
      id: demoId(2),
      label: 'demo event (ended, needs a recap)',
      make: async () => ({
        ...base,
        id: demoId(2),
        title: '[Demo] Spectra Hack',
        category: 'competition',
        summary: 'Ended and waiting for its recap and photos. Sample event.',
        startsAt: at(-10),
      }),
    },
    {
      id: demoId(3),
      label: 'demo event (draft)',
      make: async () => ({
        ...base,
        id: demoId(3),
        title: '[Demo] Unity Workshop',
        category: 'workshop',
        summary: 'A draft: not shown on the site until it is published. Sample event.',
        startsAt: at(30),
      }),
    },
    {
      id: demoId(4),
      label: 'demo event (timeline, 6 photos)',
      make: async () => ({
        ...base,
        id: demoId(4),
        title: '[Demo] AR Treasure Hunt',
        category: 'competition',
        summary: 'Teams solved AR clues across the campus. Sample event.',
        startsAt: at(-40),
        recap:
          'Twelve teams followed AR markers across the campus.\n\nThis recap is placeholder text until the real one is written.',
        photos: await photos(demoId(4), 'AR Treasure Hunt', 6, 1),
        inTimeline: true,
      }),
    },
    {
      id: demoId(5),
      label: 'demo event (timeline, 12 photos)',
      make: async () => ({
        ...base,
        id: demoId(5),
        title: '[Demo] Blender for XR',
        category: 'workshop',
        summary: 'Modelling assets for headsets, from a cube to a scene. Sample event.',
        startsAt: at(-75),
        endsAt: at(-74),
        recap: 'A two-day workshop on modelling and exporting assets for XR. Placeholder recap.',
        photos: await photos(demoId(5), 'Blender for XR', 12, 2),
        inTimeline: true,
      }),
    },
    {
      id: demoId(6),
      label: 'demo event (timeline, poster and 4 photos)',
      make: async () => ({
        ...base,
        id: demoId(6),
        title: '[Demo] HackXR 2025',
        category: 'hackathon',
        summary: 'Thirty-six hours of building for headsets. Sample event.',
        startsAt: at(-120),
        endsAt: at(-118),
        poster: await upload(
          'event-poster',
          demoId(6),
          'HackXR 2025',
          1,
          'Demo poster for HackXR 2025',
        ),
        recap: 'Placeholder recap for the club’s flagship hackathon.',
        photos: await photos(demoId(6), 'HackXR 2025', 4, 3),
        inTimeline: true,
      }),
    },
    {
      id: demoId(7),
      label: 'demo event (every field at its length limit)',
      make: async () => ({
        ...base,
        id: demoId(7),
        title: `[Demo] ${'Longest possible event title to test the layout '.repeat(2)}`.slice(
          0,
          80,
        ),
        category: 'other',
        summary:
          `Sample event at every length limit, so the cards are seen at their fullest ${'and longest '.repeat(10)}`.slice(
            0,
            160,
          ),
        venue: `A venue name at the length limit ${'with more words '.repeat(10)}`.slice(0, 120),
        mode: 'hybrid',
        startsAt: at(21),
        published: true,
        registrationUrl,
        poster: await upload(
          'event-poster',
          demoId(7),
          'Tall poster',
          3,
          'Demo poster in a tall 9:16 shape',
        ),
      }),
    },
  ];
  for (const event of events) {
    await ensure(
      event.label,
      () => data.events.get(event.id),
      async () => data.events.create(await event.make(), SEED_ACTOR),
    );
  }

  // Enough club photos to see the gallery's filters and "Show more" at work.
  for (let index = 0; index < 28; index += 1) {
    const id = demoId(100 + index);
    const category = CATEGORIES[index % CATEGORIES.length]!.id;
    await ensure(
      `demo club photo ${index + 1}`,
      () => data.gallery.get(id),
      async () =>
        data.gallery.create(
          {
            id,
            image: await upload(
              'gallery-photo',
              id,
              `Club photo ${index + 1}`,
              index,
              `Demo club photo ${index + 1}`,
            ),
            category,
            caption: index % 3 === 0 ? `Demo caption ${index + 1}` : null,
          },
          SEED_ACTOR,
        ),
    );
  }

  // Every other member has a photo (portrait-shaped, to see the square crop);
  // the rest show their initials.
  const memberPhoto = async (id: string, name: string, index: number) =>
    index % 2 === 0 ? await upload('member-photo', id, name, 0, `Demo photo of ${name}`) : null;

  const corePositions = ['President', 'Vice President', 'General Secretary'];
  for (const [index, position] of corePositions.entries()) {
    const id = demoId(10 + index);
    const name = `Demo ${position}`;
    await ensure(
      `demo core member (${position})`,
      () => data.team.get(id),
      async () =>
        data.team.create(
          {
            id,
            name,
            position,
            tier: 'core',
            order: index,
            photo: await memberPhoto(id, name, index),
          },
          SEED_ACTOR,
        ),
    );
  }
  for (const [index, domain] of domains.slice(0, 3).entries()) {
    const id = demoId(20 + index);
    const name = `Demo Secretary ${index + 1}`;
    await ensure(
      `demo secretary (${domain.name})`,
      () => data.team.get(id),
      async () =>
        data.team.create(
          {
            id,
            name,
            position: `Secretary, ${domain.name}`,
            tier: 'secretary',
            domainId: domain.id,
            photo: await memberPhoto(id, name, index),
          },
          SEED_ACTOR,
        ),
    );
  }

  // A visitor's request gets a fresh id each time, so add one only to an empty inbox.
  if ((await data.sponsorships.count()) === 0) {
    await data.sponsorships.submit({
      name: 'Demo Sender',
      organisation: 'Example Immersive Labs',
      email: 'demo@example.org',
      type: 'sponsorship',
      message: 'A sample sponsorship request created by pnpm seed --demo.',
    });
    summary.push('created  demo sponsorship request');
  } else {
    summary.push('exists   sponsorship requests (inbox not empty; none added)');
  }
}
