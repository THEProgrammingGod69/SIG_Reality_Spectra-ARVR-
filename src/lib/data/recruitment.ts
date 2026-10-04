import {
  DEFAULT_RECRUITMENT,
  type RecruitmentInput,
  RecruitmentInputSchema,
  type RecruitmentSettings,
  RecruitmentSettingsSchema,
  type PublicRecruitment,
} from '@/lib/schemas/recruitment';

import { createEntity, type RepositoryDeps } from './entity';
import { TAGS } from './tags';

/** The settings collection holds one record per site-wide setting. */
const RECRUITMENT_ID = 'recruitment';

/** Recruitment settings: open or closed, the form link, the roles PDF. */
export function createRecruitmentRepository(deps: RepositoryDeps) {
  const entity = createEntity(deps, {
    label: 'The recruitment settings',
    collection: 'settings',
    input: RecruitmentInputSchema,
    record: RecruitmentSettingsSchema,
    id: () => RECRUITMENT_ID,
    score: () => 0,
    tags: [TAGS.recruitment],
    files: (settings) =>
      settings.rolesPdfUrl
        ? [{ url: settings.rolesPdfUrl, target: 'roles-pdf', recordId: null }]
        : [],
  });

  return {
    maintenance: entity.maintenance,

    /** The stored settings, or null before an admin has ever saved them. */
    get(): Promise<RecruitmentSettings | null> {
      return entity.get(RECRUITMENT_ID);
    },

    /** What the public pages show: the stored settings, or closed. */
    async getStatus(): Promise<PublicRecruitment> {
      const settings = await entity.get(RECRUITMENT_ID);
      if (settings === null) return DEFAULT_RECRUITMENT;
      const { open, formUrl, rolesPdfUrl } = settings;
      return { open, formUrl, rolesPdfUrl };
    },

    /**
     * Save the settings. `expectedUpdatedAt` is the `updatedAt` the form was
     * loaded with, or null when nothing had been saved yet.
     */
    save(
      input: RecruitmentInput,
      expectedUpdatedAt: string | null,
      actor: string,
    ): Promise<RecruitmentSettings> {
      return expectedUpdatedAt === null
        ? entity.create(input, actor)
        : entity.update(RECRUITMENT_ID, expectedUpdatedAt, input, actor);
    },
  };
}

export type RecruitmentRepository = ReturnType<typeof createRecruitmentRepository>;
