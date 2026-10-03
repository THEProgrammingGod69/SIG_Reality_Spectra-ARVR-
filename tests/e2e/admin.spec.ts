import { expect, test } from '@playwright/test';

import { adminRoutes } from '@/lib/site';

import { ADMIN, hasFiles, hasRecords, signIn } from './helpers';

/** Admin access (Stage 6, D-030). */

test.describe('signed out', () => {
  for (const route of adminRoutes) {
    test(`${route.href} redirects to sign-in and is noindex`, async ({ page }) => {
      await page.goto(route.href);

      await expect(page).toHaveURL(`/admin/login?callbackUrl=${encodeURIComponent(route.href)}`);
      await expect(page.getByRole('heading', { level: 1, name: 'Admin sign-in' })).toBeVisible();
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    });
  }

  test('the public site links to /admin from nowhere', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a[href^="/admin"]')).toHaveCount(0);
  });

  test('offers the development sign-in, and no Google button without its keys', async ({
    page,
  }) => {
    await page.goto('/admin/login');
    await expect(page.getByRole('button', { name: 'Sign in (development)' })).toBeVisible();
    if (!process.env.AUTH_GOOGLE_ID) {
      await expect(page.getByRole('button', { name: 'Sign in with Google' })).toHaveCount(0);
    }
  });

  test('refuses an account that is not on the allowlist', async ({ page }) => {
    await signIn(page, '/admin', 'not-an-admin@example.org');

    await expect(page).toHaveURL(/\/admin\/login\?.*error=AccessDenied/);
    await expect(
      page.getByRole('alert').filter({ hasText: 'not on the admin list' }),
    ).toBeVisible();
  });
});

test.describe('signed in', () => {
  test('returns to the page that was asked for, and signs out', async ({ page }) => {
    await signIn(page, '/admin/team');

    await expect(page).toHaveURL('/admin/team');
    await expect(page.getByRole('heading', { level: 1, name: 'Team' })).toBeVisible();
    const nav = page.getByRole('navigation', { name: 'Admin' }).first();
    await expect(nav.getByRole('link', { name: 'Team' })).toHaveAttribute('aria-current', 'page');
    await expect(page.getByText(ADMIN).first()).toBeVisible();

    await page.getByRole('button', { name: 'Sign out' }).first().click();
    await expect(page).toHaveURL('/admin/login');
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login\?callbackUrl=%2Fadmin/);
  });

  test('never follows a callback to another site', async ({ page }) => {
    await signIn(page, '/admin/login?callbackUrl=https%3A%2F%2Fexample.com%2Fsteal');
    await expect(page).toHaveURL('/admin');
  });

  test('the dashboard reports the data store and the setup', async ({ page }) => {
    await signIn(page);

    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();
    if (!hasRecords) await expect(page.getByText('Data store not connected')).toBeVisible();
    await expect(page.getByText('Session signing secret')).toBeVisible();
    await expect(page.getByText('Admin allowlist')).toBeVisible();
  });

  test('every tool page renders inside the panel', async ({ page }) => {
    await signIn(page);
    for (const route of adminRoutes) {
      await page.goto(route.href);
      await expect(page.getByRole('heading', { level: 1, name: route.label })).toBeVisible();
      await expect(page.locator('main#main-content')).toBeVisible();
    }
  });

  test('the upload route answers a signed-in admin', async ({ page }) => {
    await signIn(page);
    const response = await page.request.post('/api/admin/upload', {
      data: {
        target: 'gallery-photo',
        recordId: '55555555-5555-4555-8555-555555555555',
        contentType: 'image/webp',
        size: 1000,
      },
    });
    // Signed in, so never 401: a ticket where files can be stored, otherwise 503.
    expect(response.status()).toBe(hasFiles ? 200 : 503);
  });
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('the menu opens, navigates and closes', async ({ page }) => {
    await signIn(page);

    await page.getByRole('button', { name: 'Open the admin menu' }).click();
    const menu = page.getByRole('dialog');
    await menu.getByRole('link', { name: 'Gallery' }).click();

    await expect(page).toHaveURL('/admin/gallery');
    await expect(menu).toBeHidden();
    await expect(page.getByRole('heading', { level: 1, name: 'Gallery' })).toBeVisible();
  });
});
