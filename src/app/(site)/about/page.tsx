import { AboutStory } from '@/components/sections/about-story';
import { MissionVision } from '@/components/sections/mission-vision';
import { PageIntro } from '@/components/sections/page-intro';
import { TeamSection } from '@/components/sections/team-section';
import { domainGroups, siteInfo } from '@/lib/content';
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
      />
    </>
  );
}
