import { z } from 'zod';

import { entitySchemas, recordId, slug, text } from './fields';
import { ImageSchema } from './image';

/**
 * The club's public hierarchy, top first (D-027): the core team (President,
 * Vice President and the other office-bearers), then one secretary per domain.
 * Coordinators and volunteers are not listed on the site.
 */
export const TEAM_TIERS = [
  // `pass`: the tier as printed on a member's access pass on About (D-038).
  { id: 'core', label: 'Core team', pass: 'Core' },
  { id: 'secretary', label: 'Domain secretaries', pass: 'Secretary' },
] as const;

export type TeamTier = (typeof TEAM_TIERS)[number]['id'];

export const TeamTierSchema = z.enum(
  TEAM_TIERS.map((tier) => tier.id) as [TeamTier, ...TeamTier[]],
);

/** Members per tier are ordered 0…MAX_TEAM_ORDER (the admin's drag order). */
export const MAX_TEAM_ORDER = 999;

const { input, record } = entitySchemas(
  {
    id: recordId,
    name: text(2, 60),
    /** e.g. "President", "Secretary, XR Development". */
    position: text(2, 60),
    tier: TeamTierSchema,
    /**
     * The domain a secretary leads: an id from src/content/domains.json. The
     * data layer checks it exists; the schema can only check its shape.
     */
    domainId: slug.nullable().default(null),
    /** Optional: without a photo the card shows the member's initials. */
    photo: ImageSchema.nullable().default(null),
    order: z.int().min(0).max(MAX_TEAM_ORDER).default(0),
  },
  (member, ctx) => {
    if (member.tier === 'secretary' && member.domainId === null) {
      ctx.addIssue({ code: 'custom', path: ['domainId'], message: 'Choose the domain' });
    }
    if (member.tier !== 'secretary' && member.domainId !== null) {
      ctx.addIssue({
        code: 'custom',
        path: ['domainId'],
        message: 'Only secretaries belong to a domain',
      });
    }
  },
);

export const TeamMemberInputSchema = input;
export const TeamMemberSchema = record;

export type TeamMemberInput = z.input<typeof TeamMemberInputSchema>;
export type TeamMember = z.output<typeof TeamMemberSchema>;

/** What a member's card shows without a photo: "Ada Lovelace" → "AL". */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? [words[0], words[words.length - 1]] : words;
  return letters
    .map((word) => Array.from(word ?? '')[0] ?? '')
    .join('')
    .toUpperCase();
}
