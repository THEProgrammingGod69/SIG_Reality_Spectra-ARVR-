import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

import { adminRoutes, siteRoutes } from '@/lib/site';

import { hasRecords, signIn } from './helpers';

/**
 * Stage 9 accessibility audit (D-033): axe-core against WCAG 2.2 A and AA on
 * every public page, the states people actually reach (the open phone menu,
 * the photo viewer, a form showing its errors) and every admin screen. Any
 * violation fails with the rule and the elements it found.
 *
 * Pages are audited settled: reduced motion, so no element is mid-entrance,
 * and after the streamed content has arrived.
 */
test.use({ reducedMotion: 'reduce' });
test.describe.configure({ timeout: 90_000 });

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function audit(page: Page, label: string) {
  await page.waitForLoadState('networkidle');
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  const found = violations.map(
    (violation) =>
      `${violation.id} (${violation.impact}): ${violation.help} → ${violation.nodes
        .map((node) => node.target.join(' '))
        .join(' | ')}`,
  );
  expect(found, `axe on ${label}`).toEqual([]);
}

test.describe('public pages', () => {
  for (const route of siteRoutes) {
    test(`${route.href} has no WCAG A/AA violations`, async ({ page }) => {
      await page.goto(route.href);
      await audit(page, route.href);
    });
  }

  test('the open phone menu', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Open menu' }).click();
    await expect(page.getByRole('navigation', { name: 'Site menu' })).toBeVisible();
    await audit(page, 'the phone menu');
  });

  test('the contact form showing its errors', async ({ page }) => {
    await page.goto('/contact');
    await page.getByRole('button', { name: 'Send request' }).click();
    await expect(page.getByLabel('Your name')).toHaveAttribute('aria-invalid', 'true');
    await audit(page, 'the contact form with errors');
  });

  test('the contact form follows reading order by keyboard, skipping the honeypot', async ({
    page,
  }) => {
    await page.goto('/contact');
    await page.getByLabel('Your name').focus();
    for (const next of [
      'Organisation',
      'Email',
      'Phone (optional)',
      'What is it about?',
      'Message',
    ]) {
      await page.keyboard.press('Tab');
      await expect(page.getByLabel(next)).toBeFocused();
    }
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Send request' })).toBeFocused();
  });

  test('the photo viewer', async ({ page }) => {
    await page.goto('/gallery');
    // The gallery streams in: wait for it before deciding there is nothing to open.
    await expect(
      page.getByRole('group', { name: 'Filter by category' }).or(page.getByText('No photos yet')),
    ).toBeVisible();
    test.skip(await page.getByText('No photos yet').isVisible(), 'No photos in this data store');
    await page.locator('main ul button').first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await audit(page, 'the photo viewer');
  });
});

test.describe('admin', () => {
  test('the sign-in page', async ({ page }) => {
    await page.goto('/admin/login');
    await audit(page, '/admin/login');
  });

  test('every admin screen', async ({ page }) => {
    await signIn(page);
    const screens = [
      ...adminRoutes.map((route) => route.href),
      ...(hasRecords ? ['/admin/events/new', '/admin/team/new'] : []),
    ];
    for (const href of screens) {
      await page.goto(href);
      await audit(page, href);
    }
  });

  test('a delete confirmation', async ({ page }) => {
    test.skip(!hasRecords, 'Needs a data store');
    await signIn(page, '/admin/gallery');
    // Club photos list their own delete button; the inbox may well be empty.
    await expect(
      page.getByRole('heading', { name: /Club photos/ }).or(page.getByText('Data store')),
    ).toBeVisible();
    const remove = page.getByRole('button', { name: 'Delete', exact: true }).first();
    test.skip((await remove.count()) === 0, 'No club photos to open a confirmation for');
    await remove.click();
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await audit(page, 'the delete confirmation');
  });
});
