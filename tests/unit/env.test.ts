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
    expect(parsed.DATA_NAMESPACE).toBe('dev');
  });

  it('leaves not-yet-needed integrations optional so staged builds still pass', () => {
    const parsed = serverEnvSchema.parse({});

    expect(parsed.UPSTASH_REDIS_REST_URL).toBeUndefined();
    expect(parsed.AUTH_SECRET).toBeUndefined();
    expect(parsed.TURNSTILE_SECRET_KEY).toBeUndefined();
  });

  describe('DATA_NAMESPACE and the Netlify deploy context', () => {
    it('accepts lowercase words joined by hyphens, and nothing else', () => {
      expect(serverEnvSchema.safeParse({ DATA_NAMESPACE: 'test-run-1' }).success).toBe(true);
      expect(serverEnvSchema.safeParse({ DATA_NAMESPACE: 'sig:prod' }).success).toBe(false);
      expect(serverEnvSchema.safeParse({ DATA_NAMESPACE: 'Prod' }).success).toBe(false);
    });

    it('requires production deploys to use the prod namespace', () => {
      const result = serverEnvSchema.safeParse({ CONTEXT: 'production', DATA_NAMESPACE: 'dev' });
      expect(result.success).toBe(false);
      expect(
        serverEnvSchema.safeParse({ CONTEXT: 'production', DATA_NAMESPACE: 'prod' }).success,
      ).toBe(true);
    });

    it('keeps deploy previews and branch deploys off the live data', () => {
      for (const CONTEXT of ['deploy-preview', 'branch-deploy', 'dev']) {
        expect(serverEnvSchema.safeParse({ CONTEXT, DATA_NAMESPACE: 'prod' }).success).toBe(false);
        expect(serverEnvSchema.safeParse({ CONTEXT, DATA_NAMESPACE: 'preview' }).success).toBe(
          true,
        );
      }
    });

    it('fails a Netlify deploy that uses local data', () => {
      const deploy = { CONTEXT: 'deploy-preview', DATA_NAMESPACE: 'preview' };
      expect(serverEnvSchema.safeParse({ ...deploy, DATA_BACKEND: 'local' }).success).toBe(false);
      expect(serverEnvSchema.safeParse({ DATA_BACKEND: 'local' }).success).toBe(true);
      expect(serverEnvSchema.parse({}).DATA_BACKEND).toBe('upstash');
    });

    it('fails a Netlify deploy that turns the development sign-in on', () => {
      const deploy = { CONTEXT: 'deploy-preview', DATA_NAMESPACE: 'preview' };
      expect(serverEnvSchema.safeParse({ ...deploy, AUTH_DEV_SIGN_IN: 'true' }).success).toBe(
        false,
      );
      expect(serverEnvSchema.safeParse(deploy).success).toBe(true);
      expect(serverEnvSchema.safeParse({ AUTH_DEV_SIGN_IN: 'true' }).success).toBe(true);
    });

    it('does not apply the guard off Netlify (local builds, tests)', () => {
      expect(serverEnvSchema.safeParse({ DATA_NAMESPACE: 'prod' }).success).toBe(true);
    });
  });

  describe('R2', () => {
    it('wants the public base URL as a bare https origin', () => {
      const parse = (R2_PUBLIC_BASE_URL: string) =>
        serverEnvSchema.safeParse({ R2_PUBLIC_BASE_URL }).success;
      expect(parse('https://media.example.org')).toBe(true);
      expect(parse('https://pub-0123.r2.dev')).toBe(true);
      expect(parse('https://media.example.org/')).toBe(false);
      expect(parse('https://media.example.org/photos')).toBe(false);
      expect(parse('http://media.example.org')).toBe(false);
    });

    it('checks the account id and bucket name shapes', () => {
      expect(serverEnvSchema.safeParse({ R2_ACCOUNT_ID: 'not-an-id' }).success).toBe(false);
      expect(serverEnvSchema.safeParse({ R2_ACCOUNT_ID: 'a'.repeat(32) }).success).toBe(true);
      expect(serverEnvSchema.safeParse({ R2_BUCKET: 'Club_Media' }).success).toBe(false);
      expect(serverEnvSchema.safeParse({ R2_BUCKET: 'sig-media' }).success).toBe(true);
    });
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
