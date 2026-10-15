import 'server-only';

import { env, requireEnv } from '@/lib/env';
import { publicEnv } from '@/lib/env.public';

/**
 * Cloudflare Turnstile, the spam check on the /contact form (D-032).
 *
 * - `on`: both keys are set. The form shows the widget and the server verifies
 *   its token with Cloudflare before storing anything.
 * - `off`: neither key is set and this is not a Netlify deploy — a developer's
 *   computer or the tests. No widget, no check; the honeypot and the rate
 *   limit still apply.
 * - `unavailable`: a Netlify deploy without both keys, or only one key set.
 *   The form is not offered at all, rather than run unprotected (fails closed).
 */
export type TurnstileMode = 'on' | 'off' | 'unavailable';

export function resolveTurnstileMode({
  siteKey,
  secretKey,
  onNetlify,
}: {
  siteKey: string | undefined;
  secretKey: string | undefined;
  onNetlify: boolean;
}): TurnstileMode {
  if (siteKey && secretKey) return 'on';
  if (!siteKey && !secretKey && !onNetlify) return 'off';
  return 'unavailable';
}

/** This deployment's mode, from its environment. */
export function turnstileMode(): TurnstileMode {
  return resolveTurnstileMode({
    siteKey: publicEnv.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    secretKey: env.TURNSTILE_SECRET_KEY,
    // Netlify sets CONTEXT, Vercel VERCEL_ENV, on every build and function (as
    // in src/lib/auth/policy.ts): a deployed site never runs without the check.
    onNetlify:
      env.CONTEXT !== undefined ||
      (env.VERCEL_ENV !== undefined && env.VERCEL_ENV !== 'development'),
  });
}

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Ask Cloudflare whether a widget token is genuine. Any failure — a bad
 * token, a timeout, Cloudflare unreachable — counts as "not verified".
 */
export async function verifyTurnstile(token: string, remoteIp: string | null): Promise<boolean> {
  const body = new FormData();
  body.set('secret', requireEnv('TURNSTILE_SECRET_KEY', 'the contact form spam check'));
  body.set('response', token);
  if (remoteIp) body.set('remoteip', remoteIp);
  try {
    const response = await fetch(VERIFY_URL, {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return false;
    const result = (await response.json()) as { success?: unknown };
    return result.success === true;
  } catch (error) {
    console.error('[turnstile] Verification failed.', error);
    return false;
  }
}
