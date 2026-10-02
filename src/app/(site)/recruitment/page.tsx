import { DomainList } from '@/components/sections/domain-list';
import { PageIntro } from '@/components/sections/page-intro';
import { RecruitmentStatus } from '@/components/sections/recruitment-status';
import { domainGroups, interimRecruitment, socialLinks } from '@/lib/content';
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
      <RecruitmentStatus recruitment={interimRecruitment} socials={socialLinks} />
      <DomainList groups={domainGroups} />
    </>
  );
}
