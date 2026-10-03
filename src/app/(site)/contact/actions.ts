'use server';

import { headers } from 'next/headers';
import { unstable_rethrow } from 'next/navigation';

import { type ActionResult, toActionFailure } from '@/lib/action-result';
import { repositories } from '@/lib/data';
import type { SponsorshipForm } from '@/lib/schemas/sponsorship';
import { turnstileMode, verifyTurnstile } from '@/lib/turnstile';

import { sponsorshipFormAvailable } from './availability';

/** What the /contact form sends: the request, plus its two spam checks. */
export type SponsorshipSubmission = {
  form: SponsorshipForm;
  /** The honeypot: a field people never see. Anything in it means a bot. */
  website: string;
  /** The Turnstile widget's token, when the check is on. */
  turnstileToken: string | null;
};

const failed = (reason: 'invalid' | 'failed', message: string) =>
  ({ ok: false, reason, message, issues: [] }) as const;

/**
 * The visitor's address. On Netlify `x-nf-client-connection-ip` is set by
 * Netlify itself and cannot be forged; elsewhere (a developer's computer) the
 * first `x-forwarded-for` entry is the best there is.
 */
function senderAddress(requestHeaders: Headers): string {
  return (
    requestHeaders.get('x-nf-client-connection-ip') ??
    requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  );
}

/**
 * The public sponsorship and collaboration form (D-008, D-032). Not an admin
 * action, so no session; instead, in order: the honeypot, the Turnstile check,
 * validation, then the rate limit (in the data layer), before the request is
 * stored for /admin/sponsorships.
 */
export async function sendSponsorshipRequest({
  form,
  website,
  turnstileToken,
}: SponsorshipSubmission): Promise<ActionResult<null>> {
  // A bot that fills the hidden field is told it worked, and learns nothing.
  if (website.trim() !== '') return { ok: true, data: null };

  if (!sponsorshipFormAvailable()) {
    return failed(
      'failed',
      'The request form is not available right now. Please reach the club through one of its channels.',
    );
  }

  const sender = senderAddress(await headers());
  if (
    turnstileMode() === 'on' &&
    !(turnstileToken && (await verifyTurnstile(turnstileToken, sender)))
  ) {
    return failed(
      'invalid',
      'The spam check did not go through. Please complete it and send again.',
    );
  }

  try {
    await repositories().sponsorships.submit(form, { from: sender });
    return { ok: true, data: null };
  } catch (error) {
    unstable_rethrow(error);
    const failure = toActionFailure(error);
    return failure.reason === 'failed'
      ? failed(
          'failed',
          'Your request could not be sent just now. Please try again in a few minutes.',
        )
      : failure;
  }
}
