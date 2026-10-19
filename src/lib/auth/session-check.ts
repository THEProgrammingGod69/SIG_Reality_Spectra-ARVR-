import 'server-only';

import type { Session } from 'next-auth';

import { currentPasswordFingerprint, setup } from './base';
import { admittedEmail } from './policy';

/**
 * The admin session check every admin entry point makes for itself (rule 8):
 * the proxy, the panel layout, every Server Action and `/api/admin/upload`.
 * Kept apart from `session.ts` so the proxy can use it without the full
 * Auth.js setup (D-041).
 */

export type AdminSession = {
  /** The admin's allowlisted email, lowercased: recorded as `updatedBy`. */
  email: string;
};

/**
 * An Auth.js session, judged against the allowlist as it is *now*: an admin
 * removed from ADMIN_EMAILS loses access at once, without waiting for their
 * 8-hour session to expire. A development sign-in only counts where the
 * development sign-in is enabled, and a password sign-in only while
 * ADMIN_PASSWORD is still the password it used (`admittedEmail()`).
 */
export function adminFromSession(session: Session | null): AdminSession | null {
  const email = admittedEmail(
    session
      ? {
          email: session.user?.email,
          provider: session.provider,
          passwordFingerprint: session.passwordFingerprint,
        }
      : null,
    {
      admins: setup.admins,
      devSignIn: setup.devSignIn,
      passwordFingerprint: currentPasswordFingerprint,
    },
  );
  return email === null ? null : { email };
}
