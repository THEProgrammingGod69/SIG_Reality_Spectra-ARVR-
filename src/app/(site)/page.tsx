import { AboutIntro } from '@/components/sections/about-intro';
import { DomainOverview } from '@/components/sections/domain-overview';
import { Hero } from '@/components/sections/hero/hero';
import { MissionVision } from '@/components/sections/mission-vision';
import { ProjectsWorkedOn } from '@/components/sections/projects-worked-on';
import { UpcomingEvent } from '@/components/sections/upcoming-event';
import { JsonLd } from '@/components/site/json-ld';
import { contactInfo, domainGroups, profileUrls, siteInfo } from '@/lib/content';
import { publicEnv } from '@/lib/env.public';
import { pageMetadata } from '@/lib/metadata';
import { getRoute } from '@/lib/site';
import { organizationJsonLd } from '@/lib/structured-data';

const route = getRoute('/');

export const metadata = pageMetadata(route, { description: siteInfo.positioning });

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={organizationJsonLd({
          siteUrl: publicEnv.NEXT_PUBLIC_SITE_URL,
          description: siteInfo.positioning,
          slogan: siteInfo.motto,
          email: contactInfo.email,
          profiles: profileUrls,
        })}
      />

      <Hero tagline={siteInfo.tagline} />
      <AboutIntro />
      <ProjectsWorkedOn />
      <UpcomingEvent />
      <MissionVision mission={siteInfo.mission} vision={siteInfo.vision} />
      <DomainOverview groups={domainGroups} />
    </>
  );
}
