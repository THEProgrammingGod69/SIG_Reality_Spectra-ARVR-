/**
 * Thrown by `requireAdmin()` when there is no admin session. Kept apart from
 * `session.ts` (server-only) so the client-safe action results can name it.
 */
export class NotSignedInError extends Error {
  override name = 'NotSignedInError';
  constructor() {
    super('Your session has ended. Sign in again to continue.');
  }
}
