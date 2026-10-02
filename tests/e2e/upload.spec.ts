import { expect, test } from '@playwright/test';

/**
 * /api/admin/upload hands out upload URLs, so it must fail closed: without an
 * admin session every request is refused (rule 8). The signed-in case is in
 * admin.spec.ts.
 */
const request = {
  target: 'gallery-photo',
  recordId: '55555555-5555-4555-8555-555555555555',
  contentType: 'image/webp',
  size: 1000,
};

test.describe('upload token route', () => {
  test('refuses anyone who is not a signed-in admin', async ({ request: api }) => {
    const response = await api.post('/api/admin/upload', { data: request });

    expect(response.status()).toBe(401);
    expect(response.headers()['cache-control']).toContain('no-store');
    expect(await response.json()).not.toHaveProperty('uploadUrl');
  });

  test('refuses a cross-site request before looking at the session', async ({ request: api }) => {
    const response = await api.post('/api/admin/upload', {
      data: request,
      headers: { Origin: 'https://attacker.example' },
    });
    expect(response.status()).toBe(403);
  });

  test('only accepts POST', async ({ request: api }) => {
    expect((await api.get('/api/admin/upload')).status()).toBe(405);
  });
});
