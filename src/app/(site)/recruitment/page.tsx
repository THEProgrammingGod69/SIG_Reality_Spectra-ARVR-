import { Suspense } from 'react';

import { DomainList } from '@/components/sections/domain-list';
import { LoadFailed } from '@/components/sections/load-failed';
import { PageIntro } from '@/components/sections/page-intro';
import { RecruitmentStatus } from '@/components/sections/recruitment-status';
import { Section } from '@/components/ui/section';
import { Skeleton } from '@/components/ui/skeleton';
import { domainGroups, socialLinks } from '@/lib/content';
import { getRecruitment, publicRead } from '@/lib/data';
import { pageMetadata } from '@/lib/metadata';
import { getRoute, routeTitle } from '@/lib/site';

const route = getRoute('/recruitment');

export const metadata = pageMetadata(route);

export default function RecruitmentPage() {
  return (
    <>
      <PageIntro
        id="recruitment-title"
        eyebrow="Join the club"
        title={routeTitle(route)}
        lead={route.description}
      />
      <Suspense
        fallback={
          <Section className="pb-0" aria-busy="true">
            <Skeleton className="h-64 rounded-card" />
          </Section>
        }
      >
        <Status />
      </Suspense>
      <DomainList groups={domainGroups} />
    </>
  );
}

/** Set in /admin/recruitment; a save shows here at the next load (`recruitment` tag). */
async function Status() {
  const read = await publicRead('the recruitment status', getRecruitment);
  if ('failed' in read) {
    return (
      <Section className="pb-0">
        <LoadFailed what="The recruitment status" />
      </Section>
    );
  }
  return <RecruitmentStatus recruitment={read.data} socials={socialLinks} />;
}
