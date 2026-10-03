import { expect, type Page, test } from '@playwright/test';

import { hasRecords, signIn, unique } from './helpers';

/**
 * Stage 8: the sponsorship form on /contact and the admin inbox (D-008,
 * D-032). Turnstile is off here (no keys, not on Netlify); the honeypot,
 * validation and the rate limit are not. Each test sends from its own
 * address, so the per-sender limit never carries over between tests or runs.
 */
test.skip(!hasRecords, 'Needs a data store: Upstash, or DATA_BACKEND=local');
test.describe.configure({ timeout: 90_000 });
test.use({ viewport: { width: 1280, height: 900 } });

/** A fresh private-range address for this test's requests. */
async function sendFromNewAddress(page: Page) {
  const octet = () => Math.floor(Math.random() * 254) + 1;
  const address = `10.${octet()}.${octet()}.${octet()}`;
  await page.setExtraHTTPHeaders({ 'x-forwarded-for': address });
}

async function fillRequest(page: Page, organisation: string) {
  await page.getByLabel('Your name').fill('E2E Sender');
  await page.getByLabel('Organisation').fill(organisation);
  await page.getByLabel('Email').fill('e2e@example.org');
  await page.getByLabel('What is it about?').selectOption('collaboration');
  await page
    .getByLabel('Message')
    .fill('A collaboration request sent by the end-to-end tests; deleted when they finish.');
}

const send = (page: Page) => page.getByRole('button', { name: 'Send request' }).click();
const thanks = (page: Page) =>
  expect(page.getByRole('status').filter({ hasText: 'Thank you — request sent' })).toBeVisible({
    timeout: 30_000,
  });

/** The inbox entries for one organisation. */
const entries = (page: Page, organisation: string) =>
  page.getByRole('listitem').filter({ hasText: organisation });

/** Open the inbox and wait for it: the list streams in after the page shell. */
async function openInbox(page: Page) {
  await page.goto('/admin/sponsorships');
  await expect(page.getByText(/newest first|No requests yet/)).toBeVisible({ timeout: 30_000 });
}

async function deleteAll(page: Page, organisation: string) {
  await openInbox(page);
  while ((await entries(page, organisation).count()) > 0) {
    const entry = entries(page, organisation).first();
    if (!(await entry.locator('details').evaluate((el) => (el as HTMLDetailsElement).open))) {
      await entry.locator('summary').click();
    }
    await entry.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Request deleted' })).toBeVisible();
    await openInbox(page);
  }
}

test('a request sent from /contact reaches the inbox, where it is triaged and deleted', async ({
  page,
}) => {
  const organisation = unique('Immersive Org');
  await sendFromNewAddress(page);
  await page.goto('/contact');
  await fillRequest(page, organisation);
  await page.getByLabel('Phone (optional)').fill('+91 20 1234 5678');
  await send(page);
  await thanks(page);

  await signIn(page, '/admin/sponsorships');
  const entry = entries(page, organisation);
  await expect(entry).toHaveCount(1);
  // New requests open by default, with everything needed to reply.
  await expect(entry.getByRole('link', { name: 'e2e@example.org' })).toHaveAttribute(
    'href',
    'mailto:e2e@example.org',
  );
  await expect(entry.getByRole('link', { name: '+91 20 1234 5678' })).toHaveAttribute(
    'href',
    'tel:+912012345678',
  );
  await expect(entry).toContainText('Collaboration');
  await expect(entry).toContainText('New');

  await entry.getByLabel('Status').selectOption('contacted');
  await expect(page.getByRole('status').filter({ hasText: 'Marked as contacted' })).toBeVisible({
    timeout: 30_000,
  });
  await page.reload();
  await expect(entries(page, organisation)).toContainText('Contacted');

  await deleteAll(page, organisation);
  await expect(entries(page, organisation)).toHaveCount(0);
});

test('checks every field before sending anything', async ({ page }) => {
  await page.goto('/contact');
  await send(page);
  for (const field of ['Your name', 'Organisation', 'Email', 'Message']) {
    await expect(page.getByLabel(field)).toHaveAttribute('aria-invalid', 'true');
  }
  await expect(page.getByRole('status').filter({ hasText: 'Thank you' })).toHaveCount(0);
});

test('a bot that fills the hidden field is thanked, and nothing is stored', async ({ page }) => {
  const organisation = unique('Spam Bot Org');
  await sendFromNewAddress(page);
  await page.goto('/contact');
  await fillRequest(page, organisation);
  await page.locator('#sponsorship-website').fill('https://spam.example', { force: true });
  await send(page);
  await thanks(page);

  await signIn(page, '/admin/sponsorships');
  await openInbox(page);
  await expect(entries(page, organisation)).toHaveCount(0);
});

test('one address can send a few requests an hour, then is asked to wait', async ({ page }) => {
  const organisation = unique('Busy Org');
  await sendFromNewAddress(page);
  await page.goto('/contact');
  for (let request = 0; request < 3; request += 1) {
    await fillRequest(page, organisation);
    await send(page);
    await thanks(page);
    await page.getByRole('button', { name: 'Send another request' }).click();
  }
  await fillRequest(page, organisation);
  await send(page);
  await expect(page.getByRole('alert').filter({ hasText: 'try again in an hour' })).toBeVisible({
    timeout: 30_000,
  });

  await signIn(page, '/admin/sponsorships');
  await expect(entries(page, organisation)).toHaveCount(3);
  await deleteAll(page, organisation);
});
