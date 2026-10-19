import { describe, expect, it } from 'vitest';

import { cleanEnvValue, resolveEnv, serverEnvSchema } from '@/lib/env';
import { hostSiteUrl } from '@/lib/env.public';

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

    it('uses Vercel Blob on a Vercel deploy without Upstash, with the same guards (D-040)', () => {
      const production = serverEnvSchema.parse({ VERCEL_ENV: 'production' });
      expect(production.DATA_BACKEND).toBe('vercel-blob');
      expect(production.DATA_NAMESPACE).toBe('prod');
      const preview = serverEnvSchema.parse({ VERCEL_ENV: 'preview' });
      expect(preview.DATA_BACKEND).toBe('vercel-blob');
      expect(preview.DATA_NAMESPACE).toBe('preview');
      expect(
        serverEnvSchema.parse({
          VERCEL_ENV: 'production',
          UPSTASH_REDIS_REST_URL: 'https://db.upstash.io',
        }).DATA_BACKEND,
      ).toBe('upstash');
      // `vercel dev` on a laptop is not a deploy.
      expect(serverEnvSchema.parse({ VERCEL_ENV: 'development' }).DATA_BACKEND).toBe('upstash');
      for (const unsafe of [
        { DATA_BACKEND: 'local' },
        { AUTH_DEV_SIGN_IN: 'true' },
        { DATA_NAMESPACE: 'dev' },
      ]) {
        expect(serverEnvSchema.safeParse({ VERCEL_ENV: 'production', ...unsafe }).success).toBe(
          false,
        );
      }
      expect(
        serverEnvSchema.safeParse({ VERCEL_ENV: 'preview', DATA_NAMESPACE: 'prod' }).success,
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

/**
 * D-041: what a deployment actually runs with. A mistake in the host's
 * settings is corrected or ignored, never fatal, and always reported.
 */
describe('resolveEnv', () => {
  it('cleans values pasted with spaces or quotes, and treats blank as unset', () => {
    expect(cleanEnvValue('  admin  ')).toBe('admin');
    expect(cleanEnvValue('"admin"')).toBe('admin');
    expect(cleanEnvValue("'a b'")).toBe('a b');
    expect(cleanEnvValue('"unbalanced')).toBe('"unbalanced');
    expect(cleanEnvValue('   ')).toBeUndefined();
    const { env, warnings } = resolveEnv({
      ADMIN_EMAILS: '"dryerisdry@gmail.com, Mohan.Arnav24@vit.edu"',
      ADMIN_PASSWORD: '"admin"',
      AUTH_SECRET: ` "${'s'.repeat(40)}" `,
    });
    expect(env.ADMIN_EMAILS).toEqual(['dryerisdry@gmail.com', 'mohan.arnav24@vit.edu']);
    expect(env.ADMIN_PASSWORD).toBe('admin');
    expect(env.AUTH_SECRET).toBe('s'.repeat(40));
    expect(warnings).toEqual([]);
  });

  it('keeps the valid admin emails and reports the rest', () => {
    const { env, warnings } = resolveEnv({ ADMIN_EMAILS: 'a@club.org, not-an-email, b@club.org' });
    expect(env.ADMIN_EMAILS).toEqual(['a@club.org', 'b@club.org']);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatch(/^ADMIN_EMAILS/);
  });

  it('corrects the deploy guards instead of failing the deploy', () => {
    const preview = resolveEnv({
      CONTEXT: 'deploy-preview',
      DATA_NAMESPACE: 'prod',
      DATA_BACKEND: 'local',
      AUTH_DEV_SIGN_IN: 'true',
    });
    expect(preview.env.DATA_NAMESPACE).toBe('preview');
    expect(preview.env.DATA_BACKEND).toBe('netlify-blobs');
    expect(preview.env.AUTH_DEV_SIGN_IN).toBeUndefined();
    expect(preview.warnings).toHaveLength(3);

    const production = resolveEnv({ VERCEL_ENV: 'production', DATA_NAMESPACE: 'dev' });
    expect(production.env.DATA_NAMESPACE).toBe('prod');
    expect(production.env.DATA_BACKEND).toBe('vercel-blob');
    expect(production.warnings).toHaveLength(1);

    // On a developer's computer nothing is corrected.
    const local = resolveEnv({ DATA_BACKEND: 'local', AUTH_DEV_SIGN_IN: 'true' });
    expect(local.env.DATA_BACKEND).toBe('local');
    expect(local.warnings).toEqual([]);
  });

  it('ignores an invalid optional variable instead of stopping the site', () => {
    const { env, warnings } = resolveEnv({
      AUTH_SECRET: 'too-short',
      NEXT_PUBLIC_SITE_URL: 'sigarvr.netlify.app',
      ADMIN_PASSWORD: 'admin',
    });
    expect(env.AUTH_SECRET).toBeUndefined();
    expect(env.NEXT_PUBLIC_SITE_URL).toBe('http://localhost:3000');
    expect(env.ADMIN_PASSWORD).toBe('admin');
    expect(warnings.map((warning) => warning.split(' ')[0])).toEqual([
      'NEXT_PUBLIC_SITE_URL',
      'AUTH_SECRET',
    ]);
  });
});

describe('hostSiteUrl', () => {
  it("uses the host's own address when NEXT_PUBLIC_SITE_URL is not set", () => {
    expect(hostSiteUrl({ CONTEXT: 'production', URL: 'https://sigarvr.netlify.app' })).toBe(
      'https://sigarvr.netlify.app',
    );
    expect(
      hostSiteUrl({
        CONTEXT: 'deploy-preview',
        URL: 'https://sigarvr.netlify.app',
        DEPLOY_PRIME_URL: 'https://deploy-preview-2--sigarvr.netlify.app',
      }),
    ).toBe('https://deploy-preview-2--sigarvr.netlify.app');
    expect(
      hostSiteUrl({
        VERCEL_ENV: 'production',
        VERCEL_PROJECT_PRODUCTION_URL: 'sig-reality-spectra.vercel.app',
        VERCEL_URL: 'sig-reality-spectra-abc.vercel.app',
      }),
    ).toBe('https://sig-reality-spectra.vercel.app');
    expect(hostSiteUrl({})).toBeUndefined();
  });
});
