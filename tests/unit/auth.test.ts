import { describe, expect, it } from 'vitest';

import {
  authSetup,
  cookieRemovalsOnly,
  isAllowedAdmin,
  isDevSignInEnabled,
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
