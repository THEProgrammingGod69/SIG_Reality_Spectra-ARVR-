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
    expect(parsed.ADMIN_PASSWORD).toBeUndefined();
  });

  it('takes ADMIN_PASSWORD as any string of 1 to 200 characters, kept exactly', () => {
    // Weak passwords still parse: the dashboard warns, a deploy never fails on it.
    expect(serverEnvSchema.parse({ ADMIN_PASSWORD: 'admin' }).ADMIN_PASSWORD).toBe('admin');
    expect(serverEnvSchema.parse({ ADMIN_PASSWORD: ' two words ' }).ADMIN_PASSWORD).toBe(
      ' two words ',
    );
    expect(serverEnvSchema.safeParse({ ADMIN_PASSWORD: 'x'.repeat(200) }).success).toBe(true);
    expect(serverEnvSchema.safeParse({ ADMIN_PASSWORD: 'x'.repeat(201) }).success).toBe(false);
    // Blank is "not set": parseEnv drops empty variables before this schema sees them.
    expect(serverEnvSchema.safeParse({ ADMIN_PASSWORD: '' }).success).toBe(false);
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

    it('uses Netlify Blobs on a Netlify deploy without Upstash, and Upstash otherwise', () => {
      const deploy = { CONTEXT: 'production' };
      expect(serverEnvSchema.parse(deploy).DATA_BACKEND).toBe('netlify-blobs');
      expect(
        serverEnvSchema.parse({ ...deploy, UPSTASH_REDIS_REST_URL: 'https://db.upstash.io' })
          .DATA_BACKEND,
      ).toBe('upstash');
      expect(serverEnvSchema.parse({ ...deploy, DATA_BACKEND: 'upstash' }).DATA_BACKEND).toBe(
        'upstash',
      );
      expect(serverEnvSchema.parse({ DATA_BACKEND: 'netlify-blobs' }).DATA_BACKEND).toBe(
        'netlify-blobs',
      );
    });

    it('allows Netlify Blobs on every deploy context, with the usual namespaces', () => {
      for (const CONTEXT of ['production', 'deploy-preview', 'branch-deploy']) {
        const parsed = serverEnvSchema.parse({ CONTEXT, DATA_BACKEND: 'netlify-blobs' });
        expect(parsed.DATA_NAMESPACE).toBe(CONTEXT === 'production' ? 'prod' : 'preview');
      }
      expect(
        serverEnvSchema.safeParse({
          CONTEXT: 'deploy-preview',
          DATA_BACKEND: 'netlify-blobs',
          DATA_NAMESPACE: 'prod',
        }).success,
      ).toBe(false);
    });

    it('shape-checks the command-line Netlify credentials', () => {
      const site = '3970e0fe-8564-4903-9a55-c5f8de49fb8b';
      expect(serverEnvSchema.safeParse({ NETLIFY_SITE_ID: site }).success).toBe(true);
      expect(serverEnvSchema.safeParse({ NETLIFY_SITE_ID: 'my-site' }).success).toBe(false);
      expect(
        serverEnvSchema.safeParse({ NETLIFY_AUTH_TOKEN: 'nfp_' + 'a'.repeat(36) }).success,
      ).toBe(true);
      expect(serverEnvSchema.safeParse({ NETLIFY_AUTH_TOKEN: 'short' }).success).toBe(false);
    });

    it('fails a Netlify deploy that turns the development sign-in on', () => {
      const deploy = { CONTEXT: 'deploy-preview', DATA_NAMESPACE: 'preview' };
      expect(serverEnvSchema.safeParse({ ...deploy, AUTH_DEV_SIGN_IN: 'true' }).success).toBe(
        false,
      );
      expect(serverEnvSchema.safeParse(deploy).success).toBe(true);
      expect(serverEnvSchema.safeParse({ AUTH_DEV_SIGN_IN: 'true' }).success).toBe(true);
    });

    it('derives the namespace from the deploy context when it is not set', () => {
      expect(serverEnvSchema.parse({ CONTEXT: 'production' }).DATA_NAMESPACE).toBe('prod');
      for (const CONTEXT of ['deploy-preview', 'branch-deploy', 'dev']) {
        expect(serverEnvSchema.parse({ CONTEXT }).DATA_NAMESPACE).toBe('preview');
      }
      expect(serverEnvSchema.parse({}).DATA_NAMESPACE).toBe('dev');
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
