import 'server-only';

import type { Session } from 'next-auth';
import { cache } from 'react';

import { auth, DEV_PROVIDER, setup } from './config';
import { NotSignedInError } from './errors';
import { isAllowedAdmin } from './policy';

/**
 * The admin session check every admin entry point makes for itself (rule 8):
 * the proxy, the panel layout, every Server Action and `/api/admin/upload`.
 */

export type AdminSession = {
  /** The admin's Google account, lowercased: recorded as `updatedBy`. */
  email: string;
};

/**
 * An Auth.js session, judged against the allowlist as it is *now*: an admin
 * removed from ADMIN_EMAILS loses access at once, without waiting for their
 * 8-hour session to expire. A development sign-in only counts where the
 * development sign-in is enabled.
 */
export function adminFromSession(session: Session | null): AdminSession | null {
  const email = session?.user?.email?.toLowerCase();
  if (!email || !isAllowedAdmin(email, setup.admins)) return null;
  if (session?.provider === DEV_PROVIDER && !setup.devSignIn) return null;
  return { email };
}

/** The signed-in admin, or null. Cached for the duration of one request. */
export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  if (!setup.secret) return null;
  return adminFromSession(await auth());
});

/** The signed-in admin, or a `NotSignedInError` (Server Actions: use `adminAction()`). */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (session === null) throw new NotSignedInError();
  return session;
}
