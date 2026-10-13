import { Users } from 'lucide-react';
import Image from 'next/image';
import type { ReactNode } from 'react';

import { Stagger } from '@/components/motion/stagger';
import { Tilt } from '@/components/motion/tilt';
import { Badge } from '@/components/ui/badge';
import { Card, CardBody, CardMedia, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Heading } from '@/components/ui/heading';
import { Section } from '@/components/ui/section';
import { Text } from '@/components/ui/text';
import type { PublicTeam } from '@/lib/data';
import { initialsOf, TEAM_TIERS } from '@/lib/schemas/team';

import { SectionHeading } from './section-heading';

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
      <SectionHeading id={id} eyebrow="The people" title={title} lead={lead} />
      <div className="mt-12">{children}</div>
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
    <div className="flex flex-col gap-16">
      {groups.map((group) => (
        <section key={group.id} aria-labelledby={`team-${group.id}`}>
          <div className="flex items-center gap-4">
            <Heading level={3} size="sm" id={`team-${group.id}`}>
              {group.label}
            </Heading>
            <span aria-hidden="true" className="h-px flex-1 bg-(--color-border)" />
            <Text as="span" size="sm" tone="subtle" className="font-mono">
              {String(group.members.length).padStart(2, '0')}
            </Text>
          </div>
          <Stagger
            as="ul"
            className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(min(100%,13rem),1fr))] gap-6"
          >
            {group.members.map((member) => (
              <li key={member.id}>
                <Tilt>
                  <MemberCard
                    member={member}
                    domain={member.domainId ? domainNames[member.domainId] : undefined}
                  />
                </Tilt>
              </li>
            ))}
          </Stagger>
        </section>
      ))}
    </div>
  );
}

/**
 * A square photo, centre-cropped, or the member's initials; name, position,
 * domain. The photo eases closer under the pointer and a spotlight follows it
 * (D-037) — `transform` and `opacity` only.
 */
function MemberCard({ member, domain }: { member: PublicMember; domain: string | undefined }) {
  return (
    <Card spotlight className="group/member">
      <CardMedia ratio="1/1">
        {member.photo ? (
          <Image
            src={member.photo.url}
            alt={member.photo.alt}
            fill
            // 13rem-minimum tiles: one column on phones, two from 28rem, three from 48rem.
            sizes="(min-width: 64rem) 16rem, (min-width: 48rem) 33vw, (min-width: 28rem) 50vw, 100vw"
            className="object-cover transition-transform duration-(--dur-long) ease-out-expo group-hover/member:scale-105"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_50%_120%,color-mix(in_oklab,var(--color-spectra-violet)_28%,transparent),transparent_70%)] font-display text-display-lg text-(--color-silver)"
          >
            {initialsOf(member.name)}
          </span>
        )}
        {/* Light falls off toward the name: the photo settles into the card. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-(--color-surface) to-transparent"
        />
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
