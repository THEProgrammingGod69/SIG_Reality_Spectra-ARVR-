import { expect, test } from '@playwright/test';

import { isWeakPassword } from '@/lib/auth/policy';
import { adminRoutes, siteRoutes } from '@/lib/site';

import { ADMIN, ADMIN_PASSWORD, hasFiles, hasRecords, signIn, signInWithPassword } from './helpers';

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

  test('the public site links to /admin only from the footer, once, nofollow', async ({ page }) => {
    for (const route of siteRoutes) {
      await page.goto(route.href);
      const links = page.locator('a[href^="/admin"]');
      await expect(links, route.href).toHaveCount(1);
      await expect(page.getByRole('contentinfo').locator('a[href^="/admin"]')).toHaveCount(1);
      await expect(page.getByRole('banner').locator('a[href^="/admin"]')).toHaveCount(0);
      await expect(links).toHaveAttribute('href', '/admin/login');
      await expect(links).toHaveAttribute('rel', /(^|\s)nofollow(\s|$)/);
    }
  });

  test('offers the password and development sign-ins, and no Google button without its keys', async ({
    page,
  }) => {
    await page.goto('/admin/login');
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute(
      'autocomplete',
      'current-password',
    );
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

test.describe('the password sign-in', () => {
  // Each test comes from its own address, so repeated runs against one dev
  // server never reach the per-address attempt limit (10 per 15 minutes).
  test.beforeEach(async ({ page }) => {
    const octet = () => Math.floor(Math.random() * 254) + 1;
    await page.setExtraHTTPHeaders({
      'x-forwarded-for': `10.${octet()}.${octet()}.${octet()}`,
    });
  });

  test('lets the first admin in with ADMIN_PASSWORD', async ({ page }) => {
    await signInWithPassword(page, ADMIN, ADMIN_PASSWORD, '/admin/events');

    await expect(page).toHaveURL('/admin/events');
    await expect(page.getByRole('heading', { level: 1, name: 'Events' })).toBeVisible();
    await expect(page.getByText(ADMIN).first()).toBeVisible();
  });

  test('refuses a wrong password', async ({ page }) => {
    await signInWithPassword(page, ADMIN, `${ADMIN_PASSWORD}-wrong`);

    await expect(page).toHaveURL(/\/admin\/login\?.*error=CredentialsSignin/);
    await expect(
      page.getByRole('alert').filter({ hasText: 'Wrong email or password.' }),
    ).toBeVisible();
  });

  test('refuses an email that is not on the allowlist, with the same message', async ({ page }) => {
    const stranger = `not-an-admin-${Date.now().toString(36)}@example.org`;
    await signInWithPassword(page, stranger, ADMIN_PASSWORD);

    await expect(page).toHaveURL(/\/admin\/login\?.*error=CredentialsSignin/);
    await expect(
      page.getByRole('alert').filter({ hasText: 'Wrong email or password.' }),
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
    // The sign-in form renders once the sign-out has fully gone through.
    await expect(page.getByLabel('Admin email')).toBeVisible();
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
    await expect(page.getByText('Password sign-in', { exact: true })).toBeVisible();
    // The warning says the password is weak, never what it is.
    const weak = page.getByText(
      "Weak admin password — set a longer ADMIN_PASSWORD in the host's settings",
    );
    await expect(weak).toHaveCount(isWeakPassword(ADMIN_PASSWORD) ? 1 : 0);
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
