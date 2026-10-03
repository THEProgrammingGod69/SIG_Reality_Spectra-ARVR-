import { z } from 'zod';

import { entitySchemas, httpsUrl, mediaUrl } from './fields';

/**
 * Recruitment settings, one record for the whole site (/admin/recruitment).
 *
 * Opening recruitment needs only the application form. The roles and
 * responsibilities PDF is optional: until it is uploaded the public page says
 * so plainly instead of showing a broken download (D-028).
 */
const { input, record } = entitySchemas(
  {
    open: z.boolean(),
    formUrl: httpsUrl.nullable().default(null),
    rolesPdfUrl: mediaUrl.nullable().default(null),
  },
  (settings, ctx) => {
    if (settings.open && settings.formUrl === null) {
      ctx.addIssue({
        code: 'custom',
        path: ['formUrl'],
        message: 'Recruitment cannot be open without a form link',
      });
    }
  },
);

export const RecruitmentInputSchema = input;
export const RecruitmentSettingsSchema = record;

export type RecruitmentInput = z.input<typeof RecruitmentInputSchema>;
/** What the public pages need: the input fields, without the bookkeeping. */
export type PublicRecruitment = z.output<typeof RecruitmentInputSchema>;
export type RecruitmentSettings = z.output<typeof RecruitmentSettingsSchema>;

/** Before an admin has ever saved the settings: closed, nothing linked. */
export const DEFAULT_RECRUITMENT: PublicRecruitment = {
  open: false,
  formUrl: null,
  rolesPdfUrl: null,
};
