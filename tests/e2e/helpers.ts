import { expect, type Page, test } from '@playwright/test';

/**
 * Shared by the admin specs. They sign in with the development sign-in as the
 * first ADMIN_EMAILS address (playwright.config.ts sets one where none exists).
 */
export const ADMIN = process.env.ADMIN_EMAILS!.split(',')[0]!.trim().toLowerCase();

/** Backends the app hosts itself: records always work, files once AUTH_SECRET signs uploads. */
const selfHosted = ['local', 'netlify-blobs', 'vercel-blob'].includes(
  process.env.DATA_BACKEND ?? '',
);

/** Whether this run has somewhere to keep records and files (Netlify Blobs, Upstash/R2, or local mode). */
export const hasRecords = selfHosted || Boolean(process.env.UPSTASH_REDIS_REST_URL);
export const hasFiles = selfHosted || Boolean(process.env.R2_BUCKET);

/** A deployed site under test (`pnpm test:deployed`), not a local server. */
export const deployed = Boolean(process.env.PLAYWRIGHT_BASE_URL);

/**
 * The admin password this run's server has: .env.local's, or the throwaway
 * one playwright.config.ts sets. Never written into a test.
 */
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;

/** Waits for a sign-in form's answer: the page asked for, or the sign-in page with an error. */
async function signInSettled(page: Page) {
  // The first sign-in compiles the action on the dev server, so allow time.
  await page.waitForURL((url) => url.pathname !== '/admin/login' || url.searchParams.has('error'), {
    timeout: 30_000,
  });
}

export async function signIn(page: Page, path = '/admin', email = ADMIN) {
  // Deployed sites have no development sign-in (D-030); admin flows are tested locally.
  test.skip(deployed, 'The development sign-in is off on deployed sites');
  await page.goto(path);
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.getByLabel('Admin email').fill(email);
  await page.getByRole('button', { name: 'Sign in (development)' }).click();
  await signInSettled(page);
}

/** The email + password sign-in, from `path` (which redirects to the sign-in page). */
export async function signInWithPassword(
  page: Page,
  email: string,
  password: string,
  path = '/admin',
) {
  test.skip(deployed, "A deployed site's password is not this run's to know");
  await page.goto(path);
  await expect(page).toHaveURL(/\/admin\/login/);
  // `exact`: "Email" is also part of the development form's "Admin email".
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await signInSettled(page);
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
