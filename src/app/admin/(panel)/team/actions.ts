'use server';

import { adminAction } from '@/lib/auth/admin-action';
import { repositories } from '@/lib/data';
import type { TeamMemberInput } from '@/lib/schemas/team';

/*
 * The team tool's Server Actions. Each re-checks the session through
 * adminAction() (rule 8); the repository validates, verifies a new photo,
 * refreshes the `team` tag (rule 10) and deletes a replaced or removed photo.
 */

/** A new member joins the end of their tier; the order sent is ignored. */
export async function createTeamMember(input: TeamMemberInput) {
  return adminAction((admin) => repositories().team.append(input, admin.email));
}

export async function updateTeamMember(
  id: string,
  expectedUpdatedAt: string,
  input: TeamMemberInput,
) {
  return adminAction((admin) =>
    repositories().team.update(id, expectedUpdatedAt, input, admin.email),
  );
}

export async function deleteTeamMember(id: string, expectedUpdatedAt: string) {
  return adminAction(async () => {
    await repositories().team.remove(id, expectedUpdatedAt);
    return null;
  });
}

/** Save the core team's order, top first: every member moves, or none does. */
export async function reorderTeam(members: { id: string; expectedUpdatedAt: string }[]) {
  return adminAction(async (admin) => {
    await repositories().team.reorder(members, admin.email);
    return null;
  });
}
