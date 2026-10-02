import { ContactDetails } from '@/components/sections/contact-details';
import { PageIntro } from '@/components/sections/page-intro';
import { SocialChannels } from '@/components/sections/social-channels';
import { SponsorshipNotice } from '@/components/sections/sponsorship-notice';
import { contactInfo, socialLinks } from '@/lib/content';
import { pageMetadata } from '@/lib/metadata';
import { getRoute, routeTitle } from '@/lib/site';

const route = getRoute('/contact');

export const metadata = pageMetadata(route);

export default function ContactPage() {
  return (
    <>
      <PageIntro
        id="contact-title"
        eyebrow="Reach the club"
        title={routeTitle(route)}
        lead={route.description}
      />
      <ContactDetails
        email={contactInfo.email}
        phone={contactInfo.phone}
        address={contactInfo.address}
        map={contactInfo.map}
      />
      <SocialChannels socials={socialLinks} />
      <SponsorshipNotice socials={socialLinks} />
    </>
  );
}
