import { describe, expect, it } from 'vitest';

import {
  admittedEmail,
  authSetup,
  clientAddress,
  cookieRemovalsOnly,
  DEV_PROVIDER,
  isBearer,
  isAllowedAdmin,
  isDevSignInEnabled,
  isWeakPassword,
  PASSWORD_PROVIDER,
  passwordFingerprint,
  passwordMatches,
  safeCallbackPath,
} from '@/lib/auth/policy';

/** The admin access rules (D-030), as pure functions of the environment. */

const ADMINS = ['first@vit.edu', 'second@vit.edu'];

describe('isAllowedAdmin', () => {
  it('matches the allowlist ignoring case and surrounding spaces', () => {
    expect(isAllowedAdmin(' First@VIT.edu ', ADMINS)).toBe(true);
    expect(isAllowedAdmin('third@vit.edu', ADMINS)).toBe(false);
  });

  it('lets nobody in without an allowlist or an email', () => {
    expect(isAllowedAdmin('first@vit.edu', undefined)).toBe(false);
    expect(isAllowedAdmin('first@vit.edu', [])).toBe(false);
    expect(isAllowedAdmin(null, ADMINS)).toBe(false);
    expect(isAllowedAdmin('', ADMINS)).toBe(false);
  });
});

describe('isDevSignInEnabled', () => {
  it('is on under next dev, and in a build only when asked', () => {
    expect(isDevSignInEnabled({ NODE_ENV: 'development' })).toBe(true);
    expect(isDevSignInEnabled({ NODE_ENV: 'production' })).toBe(false);
    expect(isDevSignInEnabled({ NODE_ENV: 'production', AUTH_DEV_SIGN_IN: 'true' })).toBe(true);
    expect(isDevSignInEnabled({ NODE_ENV: 'production', AUTH_DEV_SIGN_IN: 'false' })).toBe(false);
  });

  it('is never on where Netlify sets CONTEXT', () => {
    for (const CONTEXT of ['production', 'deploy-preview', 'branch-deploy', 'dev']) {
      expect(isDevSignInEnabled({ NODE_ENV: 'development', CONTEXT })).toBe(false);
      expect(
        isDevSignInEnabled({ NODE_ENV: 'production', CONTEXT, AUTH_DEV_SIGN_IN: 'true' }),
      ).toBe(false);
    }
  });
});

describe('authSetup', () => {
  const base = {
    NODE_ENV: 'production',
    ADMIN_EMAILS: ADMINS,
    AUTH_SECRET: 'x'.repeat(32),
  } as const;

  it('needs a secret before any way in exists', () => {
    const setup = authSetup({ ...base, AUTH_SECRET: undefined, AUTH_DEV_SIGN_IN: 'true' });
    expect(setup).toMatchObject({ secret: false, google: false, devSignIn: false, ready: false });
  });

  it('turns Google on only with both keys', () => {
    expect(authSetup({ ...base, AUTH_GOOGLE_ID: 'id' }).google).toBe(false);
    expect(authSetup({ ...base, AUTH_GOOGLE_ID: 'id', AUTH_GOOGLE_SECRET: 's' })).toMatchObject({
      google: true,
      ready: true,
    });
  });

  it('is not ready without an admin, whatever else is set', () => {
    const setup = authSetup({
      ...base,
      ADMIN_EMAILS: undefined,
      AUTH_GOOGLE_ID: 'id',
      AUTH_GOOGLE_SECRET: 's',
    });
    expect(setup.ready).toBe(false);
  });

  it('is ready with only the development sign-in, where that is enabled', () => {
    expect(authSetup({ ...base, NODE_ENV: 'development' })).toMatchObject({
      google: false,
      devSignIn: true,
      ready: true,
    });
  });
});

describe('safeCallbackPath', () => {
  it.each([
    ['/admin/events', '/admin/events'],
    ['/admin', '/admin'],
    ['/admin/events?tab=past', '/admin/events?tab=past'],
    [['/admin/team', '/admin/events'], '/admin/team'],
  ])('keeps the admin path %j', (value, expected) => {
    expect(safeCallbackPath(value)).toBe(expected);
  });

  it.each([
    'https://example.com/admin',
    '//example.com/admin',
    '/admin//example.com',
    '/admin\\..\\evil',
    '/administrator',
    '/about',
    '/admin/login',
    '/admin/login?callbackUrl=/admin',
    '',
    undefined,
    null,
  ])('sends %j to the dashboard instead', (value) => {
    expect(safeCallbackPath(value)).toBe('/admin');
  });
});

describe('cookieRemovalsOnly', () => {
  it('passes on a removed session, never a re-issued one (D-032)', () => {
    const renewed =
      'authjs.session-token=eyJ...; Path=/; Expires=Sat, 03 Oct 2026 22:00:00 GMT; HttpOnly; SameSite=Lax';
    const removed = 'authjs.session-token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax';
    const expired = 'authjs.session-token.0=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
    expect(cookieRemovalsOnly([renewed, removed, expired])).toEqual([removed, expired]);
    expect(cookieRemovalsOnly([renewed])).toEqual([]);
  });
});

describe('isBearer (the nightly job, D-034)', () => {
  it('accepts exactly "Bearer <secret>"', () => {
    const secret = 's'.repeat(32);
    expect(isBearer(`Bearer ${secret}`, secret)).toBe(true);
    for (const header of [null, '', secret, `Bearer ${secret}x`, `bearer ${secret}`, 'Bearer ']) {
      expect(isBearer(header, secret)).toBe(false);
    }
  });
});

describe('the password sign-in', () => {
  const base = {
    NODE_ENV: 'production',
    ADMIN_EMAILS: ADMINS,
    AUTH_SECRET: 'x'.repeat(32),
  } as const;
  const strong = 'correct horse battery staple';

  it('is on with a secret, an admin and ADMIN_PASSWORD, and is a way in by itself', () => {
    expect(authSetup({ ...base, ADMIN_PASSWORD: strong })).toMatchObject({
      password: true,
      google: false,
      devSignIn: false,
      ready: true,
    });
    expect(authSetup(base).password).toBe(false);
    expect(authSetup({ ...base, AUTH_SECRET: undefined, ADMIN_PASSWORD: strong })).toMatchObject({
      password: false,
      ready: false,
    });
    expect(authSetup({ ...base, ADMIN_EMAILS: [], ADMIN_PASSWORD: strong }).password).toBe(false);
  });

  it('flags a weak password, only while the password sign-in is on', () => {
    expect(authSetup({ ...base, ADMIN_PASSWORD: 'admin' }).weakPassword).toBe(true);
    expect(authSetup({ ...base, ADMIN_PASSWORD: strong }).weakPassword).toBe(false);
    expect(
      authSetup({ ...base, AUTH_SECRET: undefined, ADMIN_PASSWORD: 'admin' }).weakPassword,
    ).toBe(false);
  });

  it('matches only the exact password, whatever the lengths', () => {
    expect(passwordMatches(strong, strong)).toBe(true);
    for (const given of ['', 'correct horse', `${strong} `, strong.toUpperCase(), `${strong}x`]) {
      expect(passwordMatches(given, strong)).toBe(false);
    }
    expect(passwordMatches('a'.repeat(5000), strong)).toBe(false);
    expect(passwordMatches(strong, 'a')).toBe(false);
  });

  it('fingerprints the password under the secret, and the print changes with either', () => {
    const secret = 's'.repeat(32);
    const print = passwordFingerprint(secret, strong);
    expect(print).toMatch(/^[0-9a-f]{32}$/);
    expect(print).not.toContain(strong);
    expect(passwordFingerprint(secret, strong)).toBe(print);
    expect(passwordFingerprint(secret, `${strong}!`)).not.toBe(print);
    expect(passwordFingerprint('t'.repeat(32), strong)).not.toBe(print);
  });

  it.each([
    'admin',
    'password',
    '123456',
    'short-pass1',
    'aaaaaaaaaaaaaaaa',
    '123456789012345',
    'Administrator2026!',
    'Password123456',
    'RealitySpectra2026!',
  ])('calls %j weak', (password) => {
    expect(isWeakPassword(password)).toBe(true);
  });

  it.each([strong, 'tram-quartz-lantern-41', 'Spectra lab nights at VIT'])(
    'accepts %j',
    (password) => {
      expect(isWeakPassword(password)).toBe(false);
    },
  );
});

describe('clientAddress (the sign-in attempt limit)', () => {
  it("prefers Netlify's own header, then the first forwarded address", () => {
    const both = new Headers({
      'x-nf-client-connection-ip': '203.0.113.9',
      'x-forwarded-for': '198.51.100.1',
    });
    expect(clientAddress(both)).toBe('203.0.113.9');
    const forwarded = new Headers({ 'x-forwarded-for': ' 198.51.100.4 , 10.0.0.1' });
    expect(clientAddress(forwarded)).toBe('198.51.100.4');
    expect(clientAddress(new Headers())).toBe('unknown');
  });
});

describe('admittedEmail (the per-request session check)', () => {
  const secret = 's'.repeat(32);
  const print = passwordFingerprint(secret, 'correct horse battery staple');
  const rules = { admins: ADMINS, devSignIn: false, passwordFingerprint: print };

  it('admits an allowlisted session, as the allowlist is now', () => {
    expect(admittedEmail({ email: 'First@VIT.edu', provider: 'google' }, rules)).toBe(
      'first@vit.edu',
    );
    expect(admittedEmail({ email: 'third@vit.edu', provider: 'google' }, rules)).toBeNull();
    expect(admittedEmail({ email: null }, rules)).toBeNull();
    expect(admittedEmail(null, rules)).toBeNull();
  });

  it('locks a password session out once ADMIN_PASSWORD changes or is removed', () => {
    const session = { email: 'first@vit.edu', provider: PASSWORD_PROVIDER };
    expect(admittedEmail({ ...session, passwordFingerprint: print }, rules)).toBe('first@vit.edu');
    const changed = passwordFingerprint(secret, 'a different passphrase entirely');
    expect(admittedEmail({ ...session, passwordFingerprint: changed }, rules)).toBeNull();
    expect(admittedEmail(session, rules)).toBeNull();
    const off = { ...rules, passwordFingerprint: null };
    expect(admittedEmail({ ...session, passwordFingerprint: print }, off)).toBeNull();
  });

  it('admits a development session only where that sign-in is on', () => {
    const session = { email: 'first@vit.edu', provider: DEV_PROVIDER };
    expect(admittedEmail(session, rules)).toBeNull();
    expect(admittedEmail(session, { ...rules, devSignIn: true })).toBe('first@vit.edu');
  });
});
