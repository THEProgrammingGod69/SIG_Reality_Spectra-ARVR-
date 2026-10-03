import { afterEach, describe, expect, it, vi } from 'vitest';

import { resolveTurnstileMode, verifyTurnstile } from '@/lib/turnstile';

/** The contact form's spam check: on, off locally, or failing closed (D-032). */
describe('Turnstile mode', () => {
  it.each([
    [{ siteKey: 'site', secretKey: 'secret', onNetlify: true }, 'on'],
    [{ siteKey: 'site', secretKey: 'secret', onNetlify: false }, 'on'],
    [{ siteKey: undefined, secretKey: undefined, onNetlify: false }, 'off'],
    // A deploy without keys never runs the form unprotected.
    [{ siteKey: undefined, secretKey: undefined, onNetlify: true }, 'unavailable'],
    // Half set up is a mistake, wherever it happens.
    [{ siteKey: 'site', secretKey: undefined, onNetlify: false }, 'unavailable'],
    [{ siteKey: undefined, secretKey: 'secret', onNetlify: false }, 'unavailable'],
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
