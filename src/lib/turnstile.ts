import 'server-only';

import { env, requireEnv } from '@/lib/env';
import { publicEnv } from '@/lib/env.public';

/**
 * Cloudflare Turnstile, the spam check on the /contact form (D-032, D-041).
 *
 * - `on`: both keys are set. The form shows the widget and the server verifies
 *   its token with Cloudflare before storing anything.
 * - `off`: the two keys are not both set. No widget and no check; the honeypot
 *   and the per-sender rate limit still guard the form, and the dashboard's
 *   Setup card lists Turnstile as not set. A deploy used to hide the form
 *   instead (D-032), which left the club without one until a Cloudflare
 *   account existed (D-041).
 */
export type TurnstileMode = 'on' | 'off';

export function resolveTurnstileMode({
  siteKey,
  secretKey,
}: {
  siteKey: string | undefined;
  secretKey: string | undefined;
}): TurnstileMode {
  return siteKey && secretKey ? 'on' : 'off';
}

/** This deployment's mode, from its environment. */
export function turnstileMode(): TurnstileMode {
  return resolveTurnstileMode({
    siteKey: publicEnv.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    secretKey: env.TURNSTILE_SECRET_KEY,
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
