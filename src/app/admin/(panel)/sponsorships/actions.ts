'use server';

import { adminAction } from '@/lib/auth/admin-action';
import { repositories } from '@/lib/data';
import type { SponsorshipStatus } from '@/lib/schemas/sponsorship';

/*
 * The sponsorship inbox's Server Actions, through adminAction() (rule 8).
 * Requests are never shown publicly, so there is no cache tag to refresh.
 */

export async function setSponsorshipStatus(
  id: string,
  expectedUpdatedAt: string,
  status: SponsorshipStatus,
) {
  return adminAction((admin) =>
    repositories().sponsorships.setStatus(id, expectedUpdatedAt, status, admin.email),
  );
}

export async function deleteSponsorship(id: string, expectedUpdatedAt: string) {
  return adminAction(async () => {
    await repositories().sponsorships.remove(id, expectedUpdatedAt);
    return null;
  });
}
