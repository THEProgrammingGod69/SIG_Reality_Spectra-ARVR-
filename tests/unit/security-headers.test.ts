import { describe, expect, it } from 'vitest';

import {
  contentSecurityPolicy,
  securityHeaders,
  type SecurityOptions,
  THIRD_PARTY,
} from '@/lib/security-headers';

/** The security headers (D-033): what is allowed, and what never is. */
const live: SecurityOptions = {
  development: false,
  https: true,
  mediaOrigin: 'https://media.example.org',
  uploadOrigin: 'https://0123456789abcdef0123456789abcdef.r2.cloudflarestorage.com',
};

const directive = (csp: string, name: string) =>
  csp
    .split('; ')
    .find((entry) => entry.startsWith(`${name} `) || entry === name)
    ?.split(' ')
    .slice(1);

describe('Content-Security-Policy', () => {
  const csp = contentSecurityPolicy(live);

  it('locks plugins, framing, the base URL and form targets', () => {
    expect(directive(csp, 'object-src')).toEqual(["'none'"]);
    expect(directive(csp, 'frame-ancestors')).toEqual(["'none'"]);
    expect(directive(csp, 'base-uri')).toEqual(["'self'"]);
    expect(directive(csp, 'form-action')).toEqual(["'self'"]);
    expect(directive(csp, 'default-src')).toEqual(["'self'"]);
  });

  it('allows scripts only from the site, Turnstile and the analytics beacon', () => {
    expect(directive(csp, 'script-src')).toEqual([
      "'self'",
      "'unsafe-inline'",
      THIRD_PARTY.turnstile,
      THIRD_PARTY.analyticsScript,
    ]);
    expect(directive(csp, 'frame-src')).toEqual([THIRD_PARTY.turnstile, THIRD_PARTY.maps]);
  });

  it('lets uploads reach exactly this account’s R2 endpoint, and media load from its domain', () => {
    expect(directive(csp, 'connect-src')).toEqual([
      "'self'",
      live.uploadOrigin,
      THIRD_PARTY.analyticsReport,
    ]);
    expect(directive(csp, 'img-src')).toContain(live.mediaOrigin);
  });

  it('upgrades stray http requests only on an https site', () => {
    expect(csp).toContain('upgrade-insecure-requests');
    expect(contentSecurityPolicy({ ...live, https: false })).not.toContain('upgrade-insecure');
  });

  it('relaxes only what the development server needs', () => {
    const dev = contentSecurityPolicy({
      development: true,
      https: false,
      mediaOrigin: null,
      uploadOrigin: null,
    });
    expect(directive(dev, 'script-src')).toContain("'unsafe-eval'");
    expect(directive(dev, 'connect-src')).toEqual([
      "'self'",
      THIRD_PARTY.r2Upload,
      THIRD_PARTY.analyticsReport,
      'ws:',
    ]);
    expect(directive(csp, 'script-src')).not.toContain("'unsafe-eval'");
    expect(dev).not.toContain('null');
  });
});

describe('securityHeaders', () => {
  const names = (options: SecurityOptions) => securityHeaders(options).map((header) => header.key);

  it('sends the full set, with HSTS only over https', () => {
    expect(names(live)).toEqual([
      'Content-Security-Policy',
      'Strict-Transport-Security',
      'X-Content-Type-Options',
      'X-Frame-Options',
      'Referrer-Policy',
      'Permissions-Policy',
      'Cross-Origin-Opener-Policy',
    ]);
    expect(names({ ...live, https: false })).not.toContain('Strict-Transport-Security');
  });

  it('turns off the device APIs the site never uses', () => {
    const policy = securityHeaders(live).find((header) => header.key === 'Permissions-Policy');
    for (const feature of ['camera=()', 'microphone=()', 'geolocation=()', 'payment=()']) {
      expect(policy?.value).toContain(feature);
    }
  });
});
