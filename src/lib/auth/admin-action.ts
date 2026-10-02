import 'server-only';

import { unstable_rethrow } from 'next/navigation';

import { type ActionResult, toActionFailure } from '@/lib/action-result';

import { type AdminSession, requireAdmin } from './session';

/**
 * The body of every admin Server Action (rules 8 and 10):
 *
 * ```ts
 * 'use server';
 * export async function saveEvent(input: EventInput, expectedUpdatedAt: string) {
 *   return adminAction((admin) =>
 *     repositories().events.update(input.id, expectedUpdatedAt, input, admin.email),
 *   );
 * }
 * ```
 *
 * It re-checks the session itself (never trusting the proxy), runs the write —
 * whose repository refreshes the cache tags — and returns an `ActionResult`
 * instead of throwing, so the form can show the message. `redirect()` and
 * `notFound()` still work inside it.
 */
export async function adminAction<T>(
  run: (admin: AdminSession) => Promise<T>,
): Promise<ActionResult<T>> {
  try {
    const admin = await requireAdmin();
    return { ok: true, data: await run(admin) };
  } catch (error) {
    unstable_rethrow(error);
    return toActionFailure(error);
  }
}
