import { expect, type Page, test } from '@playwright/test';

import { hasFiles, hasRecords, signIn, testImage, unique } from './helpers';

/**
 * Stage 7: events and the gallery, admin ↔ public. Every save must show on the
 * public pages at the next load, with no redeploy. Each test creates its own
 * records and deletes them, so it can run against a data store in use.
 */
test.skip(!hasRecords || !hasFiles, 'Needs a data store: Upstash + R2, or DATA_BACKEND=local');
// Each test is a whole flow (sign in, upload, save, check the public pages,
// delete); on a cold dev server running the suite in parallel that outlasts
// the default 30 s.
test.describe.configure({ timeout: 90_000 });

const REGISTRATION = 'https://example.org/e2e-register';

/** Fill the details every event needs. */
async function fillDetails(page: Page, title: string, startsAt: string) {
  await page.getByLabel('Title').fill(title);
  await page.getByLabel('Starts (India time)').fill(startsAt);
  await page.getByLabel('Venue').fill('E2E Lab, VIT Pune');
  await page
    .getByLabel('Summary')
    .fill('Created by the end-to-end tests; deleted when they finish.');
}

/**
 * Save, and wait for this save's own confirmation: "Event created" and
 * "Saved." differ, so an earlier toast still on screen cannot be mistaken for it.
 */
async function save(page: Page, button: 'Create event' | 'Save changes') {
  await page.getByRole('button', { name: button }).click();
  const confirmation = button === 'Create event' ? 'Event created' : 'Saved.';
  await expect(page.getByRole('status').filter({ hasText: confirmation })).toBeVisible({
    timeout: 30_000,
  });
  // A new event's editor opens at its own address (compiled on first visit in dev).
  if (button === 'Create event') {
    await expect(page).toHaveURL(/\/admin\/events\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  }
}

async function deleteEvent(page: Page) {
  await page.getByRole('button', { name: 'Delete event' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();
  await expect(page).toHaveURL('/admin/events', { timeout: 30_000 });
}

test.describe('events', () => {
  test('a published event appears on /events, follows edits, and goes when deleted', async ({
    page,
  }) => {
    const title = unique('Build Night');
    await signIn(page, '/admin/events/new');
    await fillDetails(page, title, '2030-06-01T18:00');
    await page.getByLabel('Registration link').fill(REGISTRATION);
    await page.getByRole('checkbox', { name: /Published/ }).check();
    await page
      .getByRole('group', { name: 'Poster' })
      .locator('input[type="file"]')
      .setInputFiles(testImage('poster.png'));
    await expect(page.getByLabel('Describe the image (alt text)')).toHaveValue(
      `Poster for ${title}`,
      {
        timeout: 30_000,
      },
    );
    await save(page, 'Create event');
    const editor = page.url();

    const publicPage = await page.context().newPage();
    await publicPage.goto('/events');
    const card = publicPage.getByRole('listitem').filter({ hasText: title });
    await expect(card.getByRole('img', { name: `Poster for ${title}` })).toBeVisible();
    await expect(card.getByRole('link', { name: `Register for ${title}` })).toHaveAttribute(
      'href',
      REGISTRATION,
    );

    await page.getByLabel('Title').fill(`${title} (renamed)`);
    await save(page, 'Save changes');
    await publicPage.reload();
    await expect(publicPage.getByText(`${title} (renamed)`)).toBeVisible();

    await page.goto(editor);
    await deleteEvent(page);
    await publicPage.reload();
    await expect(publicPage.getByText(title)).toHaveCount(0);
  });

  test('a past event goes on the timeline, and its photos into the gallery', async ({ page }) => {
    const title = unique('Workshop');
    await signIn(page, '/admin/events/new');
    await fillDetails(page, title, '2025-01-10T10:00');
    await page.getByLabel('Category').selectOption('workshop');
    await page.getByLabel('Recap').fill('A recap written by the end-to-end tests.');

    const timeline = page.getByRole('checkbox', { name: /On the timeline/ });
    await expect(timeline).toBeDisabled();
    await page
      .getByRole('group', { name: /Photos/ })
      .locator('input[type="file"]')
      .setInputFiles([testImage('one.png'), testImage('two.png')]);
    await expect(page.getByLabel(/Photo \d: alt text/)).toHaveCount(2, { timeout: 30_000 });
    await timeline.check();
    await save(page, 'Create event');
    const editor = page.url();

    await page.goto('/events');
    const entry = page.locator('#event-timeline').locator('..').getByRole('listitem').filter({
      hasText: title,
    });
    await expect(entry.getByText('A recap written by the end-to-end tests.')).toBeVisible();
    await expect(entry.getByRole('button')).toHaveCount(2);

    await page.goto('/gallery');
    await page.getByRole('button', { name: /^Workshops/ }).click();
    await page
      .getByRole('button', { name: `Photo from ${title}` })
      .first()
      .click();
    const viewer = page.getByRole('dialog');
    await expect(viewer).toContainText(title);
    await page.keyboard.press('Escape');
    await expect(viewer).toBeHidden();

    await page.goto(editor);
    await deleteEvent(page);
  });

  test('refuses an incomplete event, field by field', async ({ page }) => {
    await signIn(page, '/admin/events/new');
    await page.getByRole('checkbox', { name: /Published/ }).check();
    await page.getByRole('button', { name: 'Create event' }).click();

    for (const field of ['Title', 'Starts (India time)', 'Venue', 'Summary', 'Registration link']) {
      await expect(page.getByLabel(field)).toHaveAttribute('aria-invalid', 'true');
    }
    await expect(page.getByText('A published event needs a registration link')).toBeVisible();
    await expect(page).toHaveURL('/admin/events/new');
  });

  test('asks before leaving unsaved changes', async ({ page }) => {
    await signIn(page, '/admin/events/new');
    await page.getByLabel('Title').fill('Not saved yet');

    const nav = page.getByRole('navigation', { name: 'Admin' }).first();
    await nav.getByRole('link', { name: 'Dashboard' }).click();
    const dialog = page.getByRole('alertdialog', { name: 'Leave without saving?' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Stay on this page' }).click();
    await expect(page).toHaveURL('/admin/events/new');
    await expect(page.getByLabel('Title')).toHaveValue('Not saved yet');

    await nav.getByRole('link', { name: 'Dashboard' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Leave' }).click();
    await expect(page).toHaveURL('/admin');
  });

  test('refuses to overwrite a change someone else saved meanwhile', async ({ page }) => {
    const title = unique('Conflict');
    await signIn(page, '/admin/events/new');
    await fillDetails(page, title, '2030-07-01T18:00');
    await save(page, 'Create event');
    const editor = page.url();

    const other = await page.context().newPage();
    await other.goto(editor);
    await other.getByLabel('Venue').fill('Changed in the other tab');
    await save(other, 'Save changes');

    await page.getByLabel('Venue').fill('Changed here, from a stale form');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(
      page.getByRole('alert').filter({ hasText: 'Someone else saved this' }),
    ).toBeVisible({
      timeout: 30_000,
    });

    await other.reload();
    await expect(other.getByLabel('Venue')).toHaveValue('Changed in the other tab');
    await deleteEvent(other);
  });
});

test.describe('gallery', () => {
  test('uploaded club photos appear on /gallery, and go when deleted', async ({ page }) => {
    const alt = unique('club photo');
    await signIn(page, '/admin/gallery');
    await page.getByLabel('Category for new uploads').selectOption('competition');
    await page.locator('input[type="file"]').first().setInputFiles(testImage('club.png'));
    const altField = page.getByLabel('Describe the photo (alt text)');
    await expect(altField).toBeVisible({ timeout: 30_000 });

    await page.getByRole('button', { name: 'Save 1 photo' }).click();
    await expect(altField).toHaveAttribute('aria-invalid', 'true');
    await altField.fill(alt);
    await page.getByRole('button', { name: 'Save 1 photo' }).click();
    await expect(page.getByRole('status').filter({ hasText: '1 photo added' })).toBeVisible({
      timeout: 30_000,
    });

    await page.goto('/gallery');
    await page.getByRole('button', { name: /^Competitions/ }).click();
    await expect(page.getByRole('button', { name: alt })).toBeVisible();

    await page.goto('/admin/gallery');
    const card = page.getByRole('listitem').filter({ has: page.getByRole('img', { name: alt }) });
    await card.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Photo deleted' })).toBeVisible();

    await page.goto('/gallery');
    await expect(page.getByRole('button', { name: alt })).toHaveCount(0);
  });
});
