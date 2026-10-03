'use server';

import { adminAction } from '@/lib/auth/admin-action';
import { repositories } from '@/lib/data';
import type { RecruitmentInput } from '@/lib/schemas/recruitment';

/*
 * The recruitment tool's Server Action, through adminAction() (rule 8). The
 * repository validates (open needs a form link), verifies a new PDF,
 * refreshes the `recruitment` tag — /recruitment and the header — (rule 10)
 * and deletes a replaced or removed PDF.
 */

/** `expectedUpdatedAt` is null for the very first save. */
export async function saveRecruitment(input: RecruitmentInput, expectedUpdatedAt: string | null) {
  return adminAction((admin) =>
    repositories().recruitment.save(input, expectedUpdatedAt, admin.email),
  );
}
