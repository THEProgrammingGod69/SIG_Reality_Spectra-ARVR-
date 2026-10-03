import { Suspense } from 'react';

import { AboutStory } from '@/components/sections/about-story';
import { LoadFailed } from '@/components/sections/load-failed';
import { MissionVision } from '@/components/sections/mission-vision';
import { PageIntro } from '@/components/sections/page-intro';
import { TeamMembers, TeamSection } from '@/components/sections/team-section';
import { Skeleton } from '@/components/ui/skeleton';
import { domainGroups, domainNames, siteInfo } from '@/lib/content';
import { getTeam, publicRead } from '@/lib/data';
import { pageMetadata } from '@/lib/metadata';
import { clubCredit, getRoute, routeTitle, siteConfig } from '@/lib/site';

const route = getRoute('/about');

export const metadata = pageMetadata(route);

/** "3 technical · 7 non-technical", counted from domains.json. */
const domainSummary = domainGroups
  .map((group) => `${group.domains.length} ${group.label.toLowerCase()}`)
  .join(' · ');

export default function AboutPage() {
  return (
    <>
      <PageIntro
        id="about-title"
        eyebrow={clubCredit}
        title={routeTitle(route)}
        lead={siteInfo.positioning}
      />
      <AboutStory
        paragraphs={siteInfo.about.long}
        facts={[
          { label: 'Part of', value: siteConfig.parentOrganisation },
          { label: 'Domains', value: domainSummary },
          { label: 'Motto', value: siteInfo.motto },
        ]}
      />
      <MissionVision
        id="about-mission-vision"
        mission={siteInfo.mission}
        vision={siteInfo.vision}
      />
      <TeamSection
        id="team"
        title="The team"
        lead="The core team, and the secretaries who lead each domain."
      >
        <Suspense fallback={<TeamLoading />}>
          <Team />
        </Suspense>
      </TeamSection>
    </>
  );
}

/** Managed in /admin/team; a save shows here at the next load (`team` tag). */
async function Team() {
  const read = await publicRead('the team', getTeam);
  if ('failed' in read) return <LoadFailed what="The team" />;
  return <TeamMembers team={read.data} domainNames={domainNames} />;
}

function TeamLoading() {
  return (
    <div
      aria-busy="true"
      className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,13rem),1fr))] gap-6"
    >
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className="aspect-square rounded-card" />
      ))}
    </div>
  );
}
