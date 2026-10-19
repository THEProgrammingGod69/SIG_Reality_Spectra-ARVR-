import { afterEach, describe, expect, it, vi } from 'vitest';

import { resolveTurnstileMode, verifyTurnstile } from '@/lib/turnstile';

/** The contact form's spam check: on with both keys, otherwise off (D-032, D-041). */
describe('Turnstile mode', () => {
  it.each([
    [{ siteKey: 'site', secretKey: 'secret' }, 'on'],
    [{ siteKey: undefined, secretKey: undefined }, 'off'],
    // Half set up: the widget could never be verified, so it is not shown.
    [{ siteKey: 'site', secretKey: undefined }, 'off'],
    [{ siteKey: undefined, secretKey: 'secret' }, 'off'],
  ] as const)('%o → %s', (input, mode) => {
    expect(resolveTurnstileMode(input)).toBe(mode);
  });
});

describe('verifyTurnstile', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  /** The module reads the environment when it loads, so load it with the secret set. */
  async function withSecret() {
    vi.resetModules();
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret');
    return (await import('@/lib/turnstile')).verifyTurnstile;
  }

  it('needs the secret key to verify anything', async () => {
    await expect(verifyTurnstile('token', null)).rejects.toThrow(/TURNSTILE_SECRET_KEY/);
  });

  it('accepts only a token Cloudflare confirms, sending the secret and address', async () => {
    const verify = await withSecret();
    const fetch = vi.fn(async (_url: string, init: RequestInit) => {
      const body = init.body as FormData;
      const ok = body.get('response') === 'good' && body.get('secret') === 'test-secret';
      expect(body.get('remoteip')).toBe('203.0.113.7');
      return Response.json({ success: ok });
    });
    vi.stubGlobal('fetch', fetch);

    expect(await verify('good', '203.0.113.7')).toBe(true);
    expect(await verify('forged', '203.0.113.7')).toBe(false);
  });

  it('fails closed when Cloudflare cannot be reached', async () => {
    const verify = await withSecret();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout')));
    expect(await verify('good', null)).toBe(false);

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('busy', { status: 503 })));
    expect(await verify('good', null)).toBe(false);
  });
});
