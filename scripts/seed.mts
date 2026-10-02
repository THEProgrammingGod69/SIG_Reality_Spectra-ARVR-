/**
 * pnpm seed [--demo]
 *
 * Fills the data store this checkout's `.env.local` points at (its
 * DATA_NAMESPACE). Safe to run any number of times: it only ever creates
 * records that do not exist yet, and never edits or deletes one.
 *
 * Always:  copies src/content/recruitment.json into the recruitment settings,
 *          if no admin has saved them yet (the Stage 8 hand-over, D-028).
 * --demo:  adds clearly labelled sample events, team members and a
 *          sponsorship request, for local development and previews. Refused in
 *          the production namespace.
 *
 * Changes made here bypass the admin panel, so the running site shows them
 * within an hour (the public reads' cache lifetime), or at once after a
 * restart or redeploy.
 */
import { existsSync } from 'node:fs';

// Load the environment before anything reads it (src/lib/env.ts parses on import).
if (existsSync('.env.local')) process.loadEnvFile('.env.local');

const { interimRecruitment, domains } = await import('@/lib/content');
const { AlreadyExistsError } = await import('@/lib/data/errors');
const { createDataServices } = await import('@/lib/data/runtime');

const SEED_ACTOR = 'seed-script@reality-spectra.invalid';
const DAY = 24 * 60 * 60 * 1000;

const data = createDataServices({ invalidate: () => {} });
const demo = process.argv.includes('--demo');
const summary: string[] = [];

/** Create a record unless one with its id exists. */
async function ensure(label: string, create: () => Promise<unknown>) {
  try {
    await create();
    summary.push(`created  ${label}`);
  } catch (error) {
    if (!(error instanceof AlreadyExistsError)) throw error;
    summary.push(`exists   ${label}`);
  }
}

console.log(`Seeding namespace "${data.namespace}"${demo ? ' with demo data' : ''}…`);

if ((await data.recruitment.get()) === null) {
  await data.recruitment.save(interimRecruitment, null, SEED_ACTOR);
  summary.push('created  recruitment settings (from src/content/recruitment.json)');
} else {
  summary.push('exists   recruitment settings (an admin has saved them; left alone)');
}

if (demo) {
  if (data.namespace === 'prod') {
    throw new Error('Demo data is never written to the production namespace.');
  }

  const at = (days: number) => new Date(Date.now() + days * DAY).toISOString();
  // Fixed ids, so a second run finds the same records and skips them.
  const demoId = (n: number) => `de300000-0000-4000-8000-${String(n).padStart(12, '0')}`;
  const demoEvent = {
    category: 'hackathon',
    summary: 'Sample event created by pnpm seed --demo, for trying the site out.',
    description: 'Demo data. Delete it from the admin panel at any time.',
    venue: 'VIT Pune',
    mode: 'offline',
  } as const;

  await ensure('demo event (current)', () =>
    data.events.create(
      {
        ...demoEvent,
        id: demoId(1),
        title: '[Demo] XR Build Night',
        startsAt: at(14),
        endsAt: at(15),
        published: true,
        registrationUrl: 'https://example.org/register',
      },
      SEED_ACTOR,
    ),
  );
  await ensure('demo event (ended, awaiting the timeline)', () =>
    data.events.create(
      {
        ...demoEvent,
        id: demoId(2),
        title: '[Demo] Spectra Hack',
        category: 'competition',
        startsAt: at(-10),
      },
      SEED_ACTOR,
    ),
  );
  await ensure('demo event (draft)', () =>
    data.events.create(
      {
        ...demoEvent,
        id: demoId(3),
        title: '[Demo] Unity Workshop',
        category: 'workshop',
        startsAt: at(30),
      },
      SEED_ACTOR,
    ),
  );

  const corePositions = ['President', 'Vice President'];
  for (const [index, position] of corePositions.entries()) {
    await ensure(`demo core member (${position})`, () =>
      data.team.create(
        { id: demoId(10 + index), name: `Demo ${position}`, position, tier: 'core', order: index },
        SEED_ACTOR,
      ),
    );
  }
  for (const [index, domain] of domains.slice(0, 3).entries()) {
    await ensure(`demo secretary (${domain.name})`, () =>
      data.team.create(
        {
          id: demoId(20 + index),
          name: `Demo Secretary ${index + 1}`,
          position: `Secretary, ${domain.name}`,
          tier: 'secretary',
          domainId: domain.id,
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

console.log(summary.map((line) => `  ${line}`).join('\n'));
console.log('Done.');
