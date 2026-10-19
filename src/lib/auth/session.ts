import 'server-only';

import { cache } from 'react';

import { auth, setup } from './config';
import { NotSignedInError } from './errors';
import { type AdminSession, adminFromSession } from './session-check';

export { type AdminSession, adminFromSession };

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
