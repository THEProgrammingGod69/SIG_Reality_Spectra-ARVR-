import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

import archive from '@/content/archive.json';

import { showAll, signIn } from './helpers';

/**
 * The club archive in /gallery: photos and clips committed to Git, merged with
 * whatever the data store holds. Nothing here needs a data store — the archive
 * shows without one — and nothing writes, so it runs against any site.
 *
 * The store may add photos of its own (other specs create and delete some), so
 * these assert the archive's items and the gallery's rules, never exact totals.
 */
test.describe.configure({ timeout: 60_000 });

const clips = archive.filter((entry) => entry.kind === 'video');
const photos = archive.filter((entry) => entry.kind === 'photo');
const hackathons = archive.filter((entry) => entry.category === 'hackathon');
const workshops = archive.filter((entry) => entry.category === 'workshop');
/** The newest clip: dated after every archive photo, so it would lead if clips could. */
const newestClip = [...clips].sort((a, b) => Date.parse(b.date) - Date.parse(a.date))[0]!;

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function openGallery(page: Page) {
  await page.goto('/gallery');
  const filters = page.getByRole('group', { name: 'Filter by category' });
  await expect(filters).toBeVisible();
  return filters;
}

/** The number a filter button shows, e.g. "Hackathons 14" → 14. */
async function countOf(filters: ReturnType<Page['getByRole']>, name: RegExp) {
  const label = await filters.getByRole('button', { name }).textContent();
  return Number(/(\d+)\s*$/.exec(label ?? '')?.[1]);
}

/** The grid's tiles that are really there (a leaving tile is hidden, then removed). */
const tiles = (page: Page) => page.locator('main ul').first().getByRole('button');

test('shows the archive, with Hackathons and Workshops filters and their counts', async ({
  page,
}) => {
  const filters = await openGallery(page);
  await expect(filters.getByRole('button', { name: /^Hackathons \d+$/ })).toBeVisible();
  await expect(filters.getByRole('button', { name: /^Workshops \d+$/ })).toBeVisible();
  expect(await countOf(filters, /^Hackathons/)).toBeGreaterThanOrEqual(hackathons.length);
  expect(await countOf(filters, /^Workshops/)).toBeGreaterThanOrEqual(workshops.length);
  expect(await countOf(filters, /^All/)).toBeGreaterThanOrEqual(archive.length);
});

test('the lead tile is the newest photo, never a clip', async ({ page }) => {
  await openGallery(page);
  const lead = tiles(page).first();
  await expect(lead).not.toHaveAccessibleName(/\(video, \d+:\d\d\)$/);
  // The newest clip is still there, just not first.
  await showAll(page);
  await expect(
    page.getByRole('button', { name: new RegExp(`^${escape(newestClip.alt)}`) }),
  ).toBeVisible();
});

test('the Hackathons filter shows only hackathon items', async ({ page }) => {
  const filters = await openGallery(page);
  const hackathonFilter = filters.getByRole('button', { name: /^Hackathons/ });
  await hackathonFilter.click();
  await expect(hackathonFilter).toHaveAttribute('aria-pressed', 'true');

  await showAll(page);
  await expect(tiles(page)).toHaveCount(await countOf(filters, /^Hackathons/));
  for (const entry of workshops) {
    await expect(page.getByRole('button', { name: entry.alt })).toHaveCount(0);
  }
  await expect(page.getByRole('button', { name: hackathons[0]!.alt })).toBeVisible();

  // And back: every archive workshop item returns.
  await filters.getByRole('button', { name: /^All/ }).click();
  await showAll(page);
  await expect(page.getByRole('button', { name: workshops[0]!.alt })).toBeVisible();
});

test('a clip tile names its length and opens a player, never autoplaying', async ({ page }) => {
  const violations: string[] = [];
  page.on('console', (message) => {
    if (/Content Security Policy/i.test(message.text())) violations.push(message.text());
  });
  const filters = await openGallery(page);
  await filters.getByRole('button', { name: /^Hackathons/ }).click();

  const clip = clips.find((entry) => entry.category === 'hackathon')!;
  const tile = page.getByRole('button', { name: new RegExp(`^${escape(clip.alt)}`) });
  await expect(tile).toHaveAccessibleName(/ \(video, \d+:\d\d\)$/);
  // Nothing plays in the grid until a mouse asks for it.
  await expect(page.locator('main ul video')).toHaveCount(0);

  await tile.click();
  const viewer = page.getByRole('dialog');
  await expect(viewer.getByRole('heading', { name: /^Video \d+ of \d+$/ })).toBeVisible();
  const player = viewer.locator('video');
  await expect(player).toHaveAttribute('controls', '');
  await expect(player).toHaveAttribute('src', clip.src);
  await expect(player).toHaveAttribute('poster', clip.poster!);
  await expect(player).toHaveAttribute('preload', 'metadata');
  await expect(player).not.toHaveAttribute('autoplay');
  expect(await player.evaluate((video: HTMLVideoElement) => video.paused)).toBe(true);
  await expect(viewer).toContainText(clip.album!);

  // The arrow keys belong to the player while it has focus…
  const title = viewer.getByRole('heading');
  const before = await title.textContent();
  await player.focus();
  await page.keyboard.press('ArrowRight');
  await expect(title).toHaveText(before!);
  // …and step through the gallery everywhere else in the viewer.
  await viewer.getByRole('button', { name: 'Next photo' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(title).not.toHaveText(before!);

  await page.keyboard.press('Escape');
  await expect(viewer).toBeHidden();
  expect(violations).toEqual([]);
});

test.describe('the clip viewer, settled', () => {
  test.use({ reducedMotion: 'reduce' });

  test('has no WCAG A/AA violations', async ({ page }) => {
    const filters = await openGallery(page);
    await filters.getByRole('button', { name: /^Hackathons/ }).click();
    const clip = clips.find((entry) => entry.category === 'hackathon')!;
    await page.getByRole('button', { name: new RegExp(`^${escape(clip.alt)}`) }).click();
    await expect(page.getByRole('dialog').locator('video')).toBeVisible();
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(violations.map((violation) => violation.id)).toEqual([]);
  });
});

test('a photo shows its album and credit in the viewer', async ({ page }) => {
  const filters = await openGallery(page);
  await filters.getByRole('button', { name: /^Hackathons/ }).click();
  const photo = photos.find((entry) => entry.credit)!;
  await page.getByRole('button', { name: photo.alt, exact: true }).click();
  const viewer = page.getByRole('dialog');
  await expect(viewer.getByRole('heading', { name: /^Photo \d+ of \d+$/ })).toBeVisible();
  await expect(viewer).toContainText(photo.credit!);
  await expect(viewer).toContainText(photo.album!);
});

test.describe('hover preview', () => {
  test('a mouse over a clip previews it, muted; leaving removes it', async ({ page }) => {
    const filters = await openGallery(page);
    await filters.getByRole('button', { name: /^Hackathons/ }).click();
    const clip = clips.find((entry) => entry.category === 'hackathon')!;
    const tile = page.getByRole('button', { name: new RegExp(`^${escape(clip.alt)}`) });
    await tile.hover();
    const preview = tile.locator('video');
    await expect(preview).toHaveAttribute('aria-hidden', 'true');
    expect(await preview.evaluate((video: HTMLVideoElement) => video.muted)).toBe(true);
    await page.mouse.move(0, 0);
    await expect(preview).toHaveCount(0);
  });

  test.describe('under reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('nothing previews, and a filter changes the grid at once', async ({ page }) => {
      const filters = await openGallery(page);
      const workshopFilter = filters.getByRole('button', { name: /^Workshops/ });
      await workshopFilter.click();
      await showAll(page);
      // No tiles kept back for an exit animation: the list is the filter's items.
      await expect(page.locator('main ul').first().locator(':scope > li')).toHaveCount(
        await countOf(filters, /^Workshops/),
      );

      const clip = clips.find((entry) => entry.category === 'workshop')!;
      const tile = page.getByRole('button', { name: new RegExp(`^${escape(clip.alt)}`) });
      await tile.hover();
      await expect(tile.locator('video')).toHaveCount(0);
    });
  });
});

test('/admin/gallery lists the archive read-only', async ({ page }) => {
  await signIn(page, '/admin/gallery');
  const heading = page.getByRole('heading', { name: `Club archive (${archive.length})` });
  await expect(heading).toBeVisible();
  const card = page.locator('[data-slot="card"]').filter({ has: heading });
  await expect(card.getByRole('img')).toHaveCount(archive.length);
  await expect(card.getByText('Video', { exact: true })).toHaveCount(clips.length);
  await expect(card.getByRole('button')).toHaveCount(0);
  await expect(card.locator('input, textarea, select')).toHaveCount(0);
});
