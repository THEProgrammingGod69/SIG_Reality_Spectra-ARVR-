import { describe, expect, it } from 'vitest';

import { serverEnvSchema } from '@/lib/env';

/**
 * These tests assert the environment CONTRACT, not the current machine's values.
 * They parse explicit objects so they behave identically on a laptop and in CI.
 */
describe('serverEnvSchema', () => {
  it('applies safe defaults when nothing is set', () => {
    const parsed = serverEnvSchema.parse({});

    expect(parsed.NODE_ENV).toBe('development');
    expect(parsed.NEXT_PUBLIC_SITE_URL).toBe('http://localhost:3000');
    expect(parsed.REDIS_KEY_PREFIX).toBe('sig:dev');
  });

  it('leaves not-yet-needed integrations optional so staged builds still pass', () => {
    const parsed = serverEnvSchema.parse({});

    expect(parsed.UPSTASH_REDIS_REST_URL).toBeUndefined();
    expect(parsed.AUTH_SECRET).toBeUndefined();
    expect(parsed.RESEND_API_KEY).toBeUndefined();
  });

  it('rejects a site URL that is not a URL', () => {
    const result = serverEnvSchema.safeParse({ NEXT_PUBLIC_SITE_URL: 'localhost:3000' });
    expect(result.success).toBe(false);
  });

  it('rejects a CRON_SECRET that is too short to be safe', () => {
    const result = serverEnvSchema.safeParse({ CRON_SECRET: 'short' });
    expect(result.success).toBe(false);
  });

  it('rejects an AUTH_SECRET that is too short to be safe', () => {
    const result = serverEnvSchema.safeParse({ AUTH_SECRET: 'short' });
    expect(result.success).toBe(false);
  });

  describe('ADMIN_EMAILS', () => {
    it('splits, trims and lowercases the allowlist', () => {
      const parsed = serverEnvSchema.parse({
        ADMIN_EMAILS: ' Secretary@vit.edu , WEBMASTER@vit.edu ',
      });

      expect(parsed.ADMIN_EMAILS).toEqual(['secretary@vit.edu', 'webmaster@vit.edu']);
    });

    it('ignores empty entries from a trailing comma', () => {
      const parsed = serverEnvSchema.parse({ ADMIN_EMAILS: 'a@vit.edu,' });
      expect(parsed.ADMIN_EMAILS).toEqual(['a@vit.edu']);
    });

    it('rejects a list containing something that is not an email', () => {
      const result = serverEnvSchema.safeParse({ ADMIN_EMAILS: 'a@vit.edu,not-an-email' });
      expect(result.success).toBe(false);
    });

    it('rejects an allowlist that would lock everyone out', () => {
      const result = serverEnvSchema.safeParse({ ADMIN_EMAILS: '   ' });
      expect(result.success).toBe(false);
    });
  });
});
