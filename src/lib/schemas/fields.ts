import { z } from 'zod';

/**
 * Field rules shared by every schema in this folder, so a rule such as "links
 * are https" or "a slug is lowercase words joined by hyphens" is written once.
 *
 * Nothing here is server-only: the admin forms validate with the same schemas
 * in the browser.
 */

/** Trimmed text with a length range sized to the layout that renders it. */
export const text = (min: number, max: number) => z.string().trim().min(min).max(max);

/** Optional long-form text: may be empty, never longer than `max`. */
export const longText = (max: number) => z.string().trim().max(max).default('');

/** Absolute https URL. Plain http is refused: every link the club shares is https. */
export const httpsUrl = z.url({
  protocol: /^https$/,
  error: 'Must be an absolute https:// URL',
});

/** Where the development server serves uploads in local data mode (D-031). */
export const LOCAL_MEDIA_PATH = '/api/local-media';

/**
 * The URL of an uploaded file: our public R2 address (https), or, in local
 * data mode, a path on the development server. That it is really ours, under
 * the right record, is checked when the record is saved (src/lib/data/media.ts).
 */
export const mediaUrl = z.union([
  httpsUrl,
  z
    .string()
    .regex(
      new RegExp(`^${LOCAL_MEDIA_PATH}/(?!.*\\.\\.)[A-Za-z0-9._/-]+$`),
      'Must be an uploaded file',
    ),
]);

/** Stable, human-readable id: lowercase words joined by hyphens. */
export const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lowercase words joined by hyphens');

/** A phone number as people write it, e.g. +91 20 1234 5678. */
export const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9][0-9 ()-]{6,19}$/, 'A phone number, e.g. +91 20 1234 5678');

/**
 * Id of an admin-managed record. The admin panel generates it in the browser
 * (`crypto.randomUUID()`) before uploading files, so uploads can be filed under
 * the record they belong to before the record is saved.
 */
export const recordId = z.uuid({ error: 'Must be a record id (UUID)' });

/**
 * A moment in time. Accepts any ISO 8601 date-time with an offset (an admin
 * form sends local time, e.g. +05:30) and stores it normalised to UTC, so
 * records compare and sort the same way everywhere.
 */
export const instant = z.iso
  .datetime({ offset: true, error: 'Enter a date and time' })
  .transform((value) => new Date(value).toISOString());

/** The admin (Google account) who made a change. */
export const actor = z.email();

/**
 * Bookkeeping every stored record carries. The data layer sets these; forms
 * never send them. `updatedAt` doubles as the record's version for the
 * "changed by someone else" check, and `updatedBy` is null only for records the
 * public created (sponsorship requests) that no admin has touched yet.
 */
export const systemFields = {
  createdAt: instant,
  updatedAt: instant,
  updatedBy: actor.nullable(),
};

export type SystemFields = {
  createdAt: string;
  updatedAt: string;
  updatedBy: string | null;
};

/**
 * Build the pair of schemas every admin-managed entity has, from one field
 * list and one set of cross-field rules (rule 3: never a second copy):
 *
 * - `input`: the editable fields — what the admin form, the Server Action and
 *   the seed script validate;
 * - `record`: the input plus `systemFields` — what is stored, and what every
 *   read is validated against.
 */
export function entitySchemas<Shape extends z.ZodRawShape>(
  shape: Shape,
  rules?: (value: z.output<z.ZodObject<Shape>>, ctx: z.RefinementCtx) => void,
) {
  const input = z.object(shape);
  const record = input.extend(systemFields);
  if (!rules) return { input, record };
  return {
    input: input.superRefine(rules),
    // A record is its input plus the system fields, so the input's rules apply
    // unchanged; TypeScript cannot see that through Zod's generic shapes.
    record: record.superRefine((value, ctx) => rules(value as z.output<z.ZodObject<Shape>>, ctx)),
  };
}
