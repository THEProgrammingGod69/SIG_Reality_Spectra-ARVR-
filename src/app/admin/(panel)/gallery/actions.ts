'use server';

import { toActionFailure } from '@/lib/action-result';
import { adminAction } from '@/lib/auth/admin-action';
import { repositories } from '@/lib/data';
import type { GalleryPhotoInput } from '@/lib/schemas/gallery';

/*
 * The gallery tool's Server Actions, through adminAction() (rule 8). The
 * repository verifies each photo's file, refreshes the `gallery` tag (rule 10)
 * and deletes a removed photo's file.
 */

/**
 * Save a batch of newly uploaded photos. Each is its own record, so one bad
 * photo does not hold back the rest: the result lists what was saved and why
 * anything was not.
 */
export async function createGalleryPhotos(inputs: GalleryPhotoInput[]) {
  return adminAction(async (admin) => {
    const { gallery } = repositories();
    const results = await Promise.all(
      inputs.map(async (input) => {
        try {
          await gallery.create(input, admin.email);
          return { id: input.id, error: null };
        } catch (error) {
          return { id: input.id, error: toActionFailure(error).message };
        }
      }),
    );
    return {
      saved: results.filter((result) => result.error === null).map((result) => result.id),
      failed: results.filter((result) => result.error !== null),
    };
  });
}

export async function updateGalleryPhoto(
  id: string,
  expectedUpdatedAt: string,
  input: GalleryPhotoInput,
) {
  return adminAction((admin) =>
    repositories().gallery.update(id, expectedUpdatedAt, input, admin.email),
  );
}

export async function deleteGalleryPhoto(id: string, expectedUpdatedAt: string) {
  return adminAction(async () => {
    await repositories().gallery.remove(id, expectedUpdatedAt);
    return null;
  });
}
