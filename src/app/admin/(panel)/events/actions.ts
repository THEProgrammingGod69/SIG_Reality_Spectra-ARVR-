'use server';

import { adminAction } from '@/lib/auth/admin-action';
import { repositories } from '@/lib/data';
import type { EventInput } from '@/lib/schemas/event';

/*
 * The events tool's Server Actions. Each re-checks the session through
 * adminAction() (rule 8); the repository validates, verifies new files,
 * refreshes the `events` tag (rule 10) and deletes files the event stopped
 * using.
 */

export async function createEvent(input: EventInput) {
  return adminAction((admin) => repositories().events.create(input, admin.email));
}

export async function updateEvent(id: string, expectedUpdatedAt: string, input: EventInput) {
  return adminAction((admin) =>
    repositories().events.update(id, expectedUpdatedAt, input, admin.email),
  );
}

export async function deleteEvent(id: string, expectedUpdatedAt: string) {
  return adminAction(async () => {
    await repositories().events.remove(id, expectedUpdatedAt);
    return null;
  });
}
