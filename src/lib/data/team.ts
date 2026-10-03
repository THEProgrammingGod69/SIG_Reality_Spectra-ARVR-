import {
  MAX_TEAM_ORDER,
  TEAM_TIERS,
  type TeamMember,
  type TeamMemberInput,
  TeamMemberInputSchema,
  TeamMemberSchema,
  type TeamTier,
} from '@/lib/schemas/team';

import { createEntity, type RepositoryDeps } from './entity';
import { InvalidDataError } from './errors';
import { TAGS } from './tags';

const tierRank = (tier: TeamTier) => TEAM_TIERS.findIndex((entry) => entry.id === tier);

/**
 * Team members (/admin/team), shown on About in hierarchy order: the core team,
 * then the domain secretaries.
 */
export function createTeamRepository(
  deps: RepositoryDeps & {
    /** The ids in src/content/domains.json, in their order. */
    domainIds: readonly string[];
  },
) {
  const entity = createEntity(deps, {
    label: 'This team member',
    collection: 'member',
    input: TeamMemberInputSchema,
    record: TeamMemberSchema,
    id: (member) => member.id,
    score: (member) => tierRank(member.tier) * (MAX_TEAM_ORDER + 1) + member.order,
    tags: [TAGS.team],
    files: (member) =>
      member.photo ? [{ url: member.photo.url, target: 'member-photo', recordId: member.id }] : [],
    check: (member) => {
      if (member.domainId !== null && !deps.domainIds.includes(member.domainId)) {
        throw new InvalidDataError('Choose one of the club’s domains.', [
          { path: 'domainId', message: 'Not one of the club’s domains' },
        ]);
      }
    },
  });

  return {
    ...entity,

    /** Add a member at the end of their tier, after everyone already in it. */
    async append(input: Omit<TeamMemberInput, 'order'>, actor: string) {
      const last = Math.max(
        -1,
        ...(await entity.list())
          .filter((member) => member.tier === input.tier)
          .map((member) => member.order),
      );
      return entity.create({ ...input, order: Math.min(last + 1, MAX_TEAM_ORDER) }, actor);
    },

    /**
     * Save a new order for some members, as the admin dragged them: all of
     * them are saved, or none.
     */
    reorder(members: readonly { id: string; expectedUpdatedAt: string }[], actor: string) {
      return entity.updateMany(
        members.map(({ id, expectedUpdatedAt }, order) => ({
          id,
          expectedUpdatedAt,
          changes: { order },
        })),
        actor,
      );
    },
  };
}

export type TeamRepository = ReturnType<typeof createTeamRepository>;

/**
 * The public team, by tier. Core members keep the admin's order; secretaries
 * follow the order of the domains they lead, as listed in domains.json.
 */
export function groupTeam<M extends Pick<TeamMember, 'tier' | 'order' | 'name' | 'domainId'>>(
  members: readonly M[],
  domainIds: readonly string[],
) {
  const domainRank = (member: M) => {
    const rank = member.domainId === null ? -1 : domainIds.indexOf(member.domainId);
    return rank === -1 ? domainIds.length : rank;
  };
  const byOrder = (a: M, b: M) => a.order - b.order || a.name.localeCompare(b.name);
  return {
    core: members.filter((member) => member.tier === 'core').sort(byOrder),
    secretaries: members
      .filter((member) => member.tier === 'secretary')
      .sort((a, b) => domainRank(a) - domainRank(b) || byOrder(a, b)),
  };
}
