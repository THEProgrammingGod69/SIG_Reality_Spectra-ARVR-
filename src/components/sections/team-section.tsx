import { Users } from 'lucide-react';
import Image from 'next/image';
import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardBody, CardMedia, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Heading } from '@/components/ui/heading';
import { Section } from '@/components/ui/section';
import { Text } from '@/components/ui/text';
import type { PublicTeam } from '@/lib/data';
import { initialsOf, TEAM_TIERS } from '@/lib/schemas/team';

type TeamSectionProps = {
  /** Heading id; must be unique on the page. */
  id: string;
  title: string;
  lead: string;
  /** The members (`TeamMembers`), streamed in by the page. */
  children: ReactNode;
};

/**
 * The team on About: the core team, then the domain secretaries (D-027),
 * managed in /admin/team. The home page has no team section.
 */
export function TeamSection({ id, title, lead, children }: TeamSectionProps) {
  return (
    <Section labelledBy={id}>
      <div className="max-w-prose">
        <Heading level={2} id={id}>
          {title}
        </Heading>
        <Text tone="muted" className="mt-4">
          {lead}
        </Text>
      </div>
      <div className="mt-10">{children}</div>
    </Section>
  );
}

type PublicMember = PublicTeam['core'][number];

/** Each tier as its own grid, top first; a tier with nobody in it is left out. */
export function TeamMembers({
  team,
  domainNames,
}: {
  team: PublicTeam;
  domainNames: Readonly<Record<string, string>>;
}) {
  const groups = TEAM_TIERS.map((tier) => ({
    ...tier,
    members: tier.id === 'core' ? team.core : team.secretaries,
  })).filter((group) => group.members.length > 0);

  if (groups.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="The team is being introduced"
        description="Profiles of the people behind the club will appear here soon."
      />
    );
  }

  return (
    <div className="flex flex-col gap-12">
      {groups.map((group) => (
        <section key={group.id} aria-labelledby={`team-${group.id}`}>
          <Heading level={3} size="sm" id={`team-${group.id}`}>
            {group.label}
          </Heading>
          <ul className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(min(100%,13rem),1fr))] gap-6">
            {group.members.map((member) => (
              <li key={member.id}>
                <MemberCard
                  member={member}
                  domain={member.domainId ? domainNames[member.domainId] : undefined}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** A square photo, centre-cropped, or the member's initials; name, position, domain. */
function MemberCard({ member, domain }: { member: PublicMember; domain: string | undefined }) {
  return (
    <Card>
      <CardMedia ratio="1/1">
        {member.photo ? (
          <Image
            src={member.photo.url}
            alt={member.photo.alt}
            fill
            sizes="(min-width: 64rem) 16rem, (min-width: 40rem) 33vw, 100vw"
            className="object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-full items-center justify-center font-display text-display-lg text-(--color-muted)"
          >
            {initialsOf(member.name)}
          </span>
        )}
      </CardMedia>
      <CardBody>
        <CardTitle>{member.name}</CardTitle>
        <Text size="sm" tone="muted" className="line-clamp-2 wrap-anywhere">
          {member.position}
        </Text>
        {domain ? (
          <Badge tone="accent" className="self-start">
            {domain}
          </Badge>
        ) : null}
      </CardBody>
    </Card>
  );
}
