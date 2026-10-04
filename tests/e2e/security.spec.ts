import { expect, type Page, test } from '@playwright/test';

import { ogImageSlug } from '@/lib/metadata';
import { adminRoutes, siteRoutes } from '@/lib/site';

import { signIn } from './helpers';

/**
 * Stage 9: security headers (D-033) on every response, and a Content Security
 * Policy strict enough to matter that still lets every page — the hero's
 * WebGL, uploads, the admin panel — work without a single violation.
 */

/** Collects CSP violations the browser reports while a page is used. */
function watchViolations(page: Page) {
  const violations: string[] = [];
  page.on('console', (message) => {
    if (/Content Security Policy|Content-Security-Policy/i.test(message.text())) {
      violations.push(message.text());
    }
  });
  return violations;
}

test('every response carries the security headers', async ({ request }) => {
  const response = await request.get('/');
  const headers = response.headers();
  expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(headers['content-security-policy']).toContain("object-src 'none'");
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['x-frame-options']).toBe('DENY');
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(headers['permissions-policy']).toContain('camera=()');
  expect(headers['cross-origin-opener-policy']).toBe('same-origin');
  expect(headers['x-powered-by']).toBeUndefined();
  // Public pages may be indexed.
  expect(headers['x-robots-tag']).toBeUndefined();
});

test('the admin panel and the API are never indexed, whatever they answer', async ({ request }) => {
  for (const path of ['/admin/login', '/admin', '/api/admin/upload']) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.headers()['x-robots-tag'], path).toBe('noindex, nofollow');
  }
});

test.describe('no CSP violations', () => {
  test.describe.configure({ timeout: 90_000 });

  test('on any public page', async ({ page }) => {
    const violations = watchViolations(page);
    for (const route of siteRoutes) {
      await page.goto(route.href);
      await page.waitForLoadState('networkidle');
    }
    expect(violations).toEqual([]);
  });

  test('across the admin panel', async ({ page }) => {
    const violations = watchViolations(page);
    await signIn(page);
    for (const route of adminRoutes) {
      await page.goto(route.href);
      await page.waitForLoadState('networkidle');
    }
    expect(violations).toEqual([]);
  });
});

test('every page has its own share image', async ({ page, request }) => {
  for (const route of siteRoutes) {
    const path = `/og/${ogImageSlug(route)}`;
    const image = await request.get(path);
    expect(image.status(), path).toBe(200);
    expect(image.headers()['content-type']).toBe('image/png');
  }
  await page.goto('/about');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    /\/og\/about$/,
  );
  await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', '1200');
  expect((await request.get('/og/not-a-page')).status()).toBe(404);
});
