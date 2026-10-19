import { expect, test } from '@playwright/test';

import { siteRoutes } from '@/lib/site';

/**
 * Stage 1 acceptance: every route in the sitemap actually loads.
 *
 * The cases are generated from `src/lib/site.ts`, so adding a page to the
 * sitemap without adding a route makes this suite fail — the check cannot go
 * stale.
 */

test.describe('public routes', () => {
  for (const route of siteRoutes) {
    test(`${route.href} responds 200 and renders one h1`, async ({ page }) => {
      const response = await page.goto(route.href);

      expect(response?.status(), `${route.href} should respond 200`).toBe(200);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1')).toBeVisible();
    });
  }

  test('every public page exposes the skip link and main landmark', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeAttached();
    await expect(page.locator('main#main-content')).toBeVisible();
  });
});

test.describe('error handling', () => {
  test('an unknown route returns a real 404', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist');

    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  });
});

test.describe('robots.txt', () => {
  test('disallows the admin panel', async ({ request }) => {
    const response = await request.get('/robots.txt');

    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain('Disallow: /admin');
    expect(body).toContain('Disallow: /api/');
  });
});

test.describe('health check', () => {
  test('reports the data store without revealing any data', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.headers()['cache-control']).toBe('no-store');
    const body = (await response.json()) as Record<string, unknown>;
    expect(Object.keys(body).sort()).toEqual(['backend', 'ok', 'records', 'uploads']);
    // 200 exactly when the store can be read and receive uploads.
    expect(response.status()).toBe(body.ok ? 200 : 503);
  });
});
