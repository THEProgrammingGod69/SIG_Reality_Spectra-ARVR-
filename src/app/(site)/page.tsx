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
 * A still at least this many pixels on its short side fills a reel card
 * sharply on any phone (a card is about 850 × 1050 device pixels at DPR 3).
 */
const SHARP_STILL = 960;

/**
 * The club archive as reel cards, newest first: only stills sharp enough for
 * a card. Most clips are phone video a few hundred pixels across, so their
 * posters stay in the gallery, which is where clips play anyway.
 */
const moments = [...archive]
  .filter((entry) => Math.min(entry.width, entry.height) >= SHARP_STILL)
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
