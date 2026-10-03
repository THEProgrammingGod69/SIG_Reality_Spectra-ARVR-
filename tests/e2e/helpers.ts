import { expect, type Page } from '@playwright/test';

/**
 * Shared by the admin specs. They sign in with the development sign-in as the
 * first ADMIN_EMAILS address (playwright.config.ts sets one where none exists).
 */
export const ADMIN = process.env.ADMIN_EMAILS!.split(',')[0]!.trim().toLowerCase();

/** Whether this run has somewhere to keep records and files (Upstash/R2, or local mode). */
export const hasRecords =
  process.env.DATA_BACKEND === 'local' || Boolean(process.env.UPSTASH_REDIS_REST_URL);
export const hasFiles = process.env.DATA_BACKEND === 'local' || Boolean(process.env.R2_BUCKET);

export async function signIn(page: Page, path = '/admin', email = ADMIN) {
  await page.goto(path);
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.getByLabel('Admin email').fill(email);
  await page.getByRole('button', { name: 'Sign in (development)' }).click();
  // The first sign-in compiles the action on the dev server, so allow time.
  await page.waitForURL((url) => url.pathname !== '/admin/login' || url.searchParams.has('error'), {
    timeout: 30_000,
  });
}

/** A 1×1 PNG, as a file the uploader converts to WebP like any photo. */
export function testImage(name: string) {
  return {
    name,
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64',
    ),
  };
}

/** A title no other test or record shares. */
export const unique = (label: string) => `E2E ${label} ${Date.now().toString(36)}`;
