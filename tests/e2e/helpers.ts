import { expect, type Page, test } from '@playwright/test';

/**
 * Shared by the admin specs. They sign in with the development sign-in as the
 * first ADMIN_EMAILS address (playwright.config.ts sets one where none exists).
 */
export const ADMIN = process.env.ADMIN_EMAILS!.split(',')[0]!.trim().toLowerCase();

/** Backends the app hosts itself: records always work, files once AUTH_SECRET signs uploads. */
const selfHosted = ['local', 'netlify-blobs'].includes(process.env.DATA_BACKEND ?? '');

/** Whether this run has somewhere to keep records and files (Netlify Blobs, Upstash/R2, or local mode). */
export const hasRecords = selfHosted || Boolean(process.env.UPSTASH_REDIS_REST_URL);
export const hasFiles = selfHosted || Boolean(process.env.R2_BUCKET);

/** A deployed site under test (`pnpm test:deployed`), not a local server. */
export const deployed = Boolean(process.env.PLAYWRIGHT_BASE_URL);

export async function signIn(page: Page, path = '/admin', email = ADMIN) {
  // Deployed sites have only Google sign-in (D-030); admin flows are tested locally.
  test.skip(deployed, 'The development sign-in is off on deployed sites');
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

/** A minimal PDF, for the roles-and-responsibilities upload. */
export function testPdf(name: string) {
  return {
    name,
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << >>\n%%EOF\n'),
  };
}

/** A title no other test or record shares. */
export const unique = (label: string) => `E2E ${label} ${Date.now().toString(36)}`;
