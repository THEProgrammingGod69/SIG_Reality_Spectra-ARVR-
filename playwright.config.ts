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
if (isCI) process.env.AUTH_DEV_SIGN_IN = 'true';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
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
    // Stage 10 adds a mobile WebKit project once there is real UI to check.
  ],

  webServer: {
    // CI tests the production build; locally the dev server is reused if running.
    command: isCI ? 'pnpm build && pnpm start' : 'pnpm dev',
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 180_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
