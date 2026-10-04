import { existsSync } from 'node:fs';

import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT ?? 3000);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;
const isCI = Boolean(process.env.CI);

/*
 * The admin tests sign in with the development sign-in as the first address in
 * ADMIN_EMAILS (D-030). Locally the tests and the dev server read the same
 * .env.local; where there is none (CI), a throwaway secret and test admin are
 * set here and inherited by the server. The production-build run switches the
 * development sign-in on explicitly — something no Netlify deploy accepts.
 */
if (existsSync('.env.local')) process.loadEnvFile('.env.local');
process.env.AUTH_SECRET ||= 'e2e-only-secret-never-used-outside-the-test-run';
process.env.ADMIN_EMAILS ||= 'e2e-admin@example.org';
// The nightly job's route needs a secret to be callable at all (D-034).
process.env.CRON_SECRET ||= 'e2e-only-cron-secret-never-used-outside-tests';
// Without Upstash, records and uploads go to the local data mode (D-031).
process.env.DATA_BACKEND ||= process.env.UPSTASH_REDIS_REST_URL ? 'upstash' : 'local';
if (isCI) process.env.AUTH_DEV_SIGN_IN = 'true';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  // One dev server compiles pages on demand and optimises every image it
  // serves; more parallel browsers than this time out instead of testing.
  workers: isCI ? 1 : 4,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : [['list']],

  use: {
    baseURL,
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // What a visitor on an iPhone gets (Safari's engine), D-034: the public
    // pages and their flows. The admin panel is used on laptops; it stays on
    // Chromium.
    {
      name: 'mobile-webkit',
      use: { ...devices['iPhone 14'] },
      testMatch: /(routes|content|hero|shell|sponsorships|a11y).spec.ts$/,
    },
  ],

  // Against a deployed site (`pnpm test:deployed`, PLAYWRIGHT_BASE_URL) no
  // server is started. Otherwise CI tests the production build, and locally
  // the dev server is reused if it is running.
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: isCI ? 'pnpm build && pnpm start' : 'pnpm dev',
        url: baseURL,
        reuseExistingServer: !isCI,
        timeout: 180_000,
        stdout: 'ignore',
        stderr: 'pipe',
      },
});
