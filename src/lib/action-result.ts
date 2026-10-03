import {
  AlreadyExistsError,
  ConflictError,
  InvalidDataError,
  MediaError,
  NotFoundError,
  RateLimitedError,
} from '@/lib/data/errors';
import { NotSignedInError } from '@/lib/auth/errors';

/**
 * What every Server Action returns (D-030) — the admin's, and the public
 * contact form's — so every form and toast reports success and failure the
 * same way. Client-safe: the error classes it reads are plain classes.
 */

export type FieldIssue = { path: string; message: string };

export type ActionFailure = {
  ok: false;
  /**
   * What the UI does about it: `conflict` → offer a reload; `signed-out` →
   * sign in; `limited` → wait before sending again.
   */
  reason: 'signed-out' | 'invalid' | 'conflict' | 'not-found' | 'media' | 'limited' | 'failed';
  message: string;
  /** Per-field problems, for the form to show beside each field. */
  issues: readonly FieldIssue[];
};

export type ActionResult<T = undefined> = { ok: true; data: T } | ActionFailure;

const failure = (
  reason: ActionFailure['reason'],
  message: string,
  issues: readonly FieldIssue[] = [],
) => ({ ok: false, reason, message, issues }) satisfies ActionFailure;

/**
 * Turn an error thrown by a write into the message an admin sees. Errors the
 * data layer throws on purpose carry a message written for the admin; anything
 * else is a bug or an outage, logged on the server and reported generically.
 */
export function toActionFailure(error: unknown): ActionFailure {
  if (error instanceof NotSignedInError) return failure('signed-out', error.message);
  if (error instanceof InvalidDataError) return failure('invalid', error.message, error.issues);
  if (error instanceof ConflictError) return failure('conflict', error.message);
  if (error instanceof NotFoundError) return failure('not-found', error.message);
  if (error instanceof AlreadyExistsError) return failure('conflict', error.message);
  if (error instanceof MediaError) return failure('media', error.message);
  if (error instanceof RateLimitedError) return failure('limited', error.message);
  console.error('[action] Failed unexpectedly.', error);
  return failure(
    'failed',
    'Something went wrong while saving. Reload to check what was saved, then try again.',
  );
}
