import 'server-only';

/**
 * The admin session check every admin entry point calls itself (rule 8):
 * Server Actions and `/api/admin/upload`.
 *
 * STUB until Stage 6. Authentication does not exist yet, so there is no admin
 * and this always answers "not signed in": everything behind it fails closed.
 * Stage 6 replaces the body with Auth.js (Google sign-in, checked against
 * ADMIN_EMAILS) and keeps the signature, so callers do not change.
 */

export type AdminSession = {
  /** The admin's Google account, lowercased: recorded as `updatedBy`. */
  email: string;
};

export async function getAdminSession(): Promise<AdminSession | null> {
  return null;
}
