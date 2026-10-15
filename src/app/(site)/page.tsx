import { AboutIntro } from '@/components/sections/about-intro';
import { DomainOverview } from '@/components/sections/domain-overview';
import { DomainTicker } from '@/components/sections/domain-ticker';
import { Hero } from '@/components/sections/hero/hero';
import { HomeCta } from '@/components/sections/home-cta';
import { MissionVision } from '@/components/sections/mission-vision';
import { Moments } from '@/components/sections/moments';
import { JsonLd } from '@/components/site/json-ld';
import { archive, contactInfo, domainGroups, profileUrls, siteInfo } from '@/lib/content';
import { categoryLabel } from '@/lib/schemas/category';
import { publicEnv } from '@/lib/env.public';
import { pageMetadata } from '@/lib/metadata';
import { getRoute } from '@/lib/site';
import { organizationJsonLd } from '@/lib/structured-data';

const route = getRoute('/');

/**
 * The club archive as reel cards, newest first. A clip shows its poster: the
 * reel is a strip of stills, and the gallery is where clips play.
 */
const moments = [...archive]
  .sort((a, b) => b.date.localeCompare(a.date))
  .map((entry) => ({
    key: entry.src,
    src: entry.kind === 'video' ? (entry.poster ?? entry.src) : entry.src,
    alt: entry.alt,
    caption: entry.caption,
    categoryLabel: categoryLabel(entry.category),
    width: entry.width,
    height: entry.height,
  }));

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

      <Hero tagline={siteInfo.tagline} motto={siteInfo.motto} />
      <AboutIntro motto={siteInfo.motto} about={siteInfo.about.short} card={siteInfo.about.card} />
      <DomainTicker groups={domainGroups} />
      <MissionVision mission={siteInfo.mission} vision={siteInfo.vision} motto={siteInfo.motto} />
      <DomainOverview groups={domainGroups} />
      <Moments moments={moments} />
      <HomeCta motto={siteInfo.motto} />
    </>
  );
}
