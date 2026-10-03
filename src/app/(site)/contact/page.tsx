import { ContactDetails } from '@/components/sections/contact-details';
import { PageIntro } from '@/components/sections/page-intro';
import { SocialChannels } from '@/components/sections/social-channels';
import { SponsorshipSection } from '@/components/sections/sponsorship-section';
import { contactInfo, socialLinks } from '@/lib/content';
import { publicEnv } from '@/lib/env.public';
import { pageMetadata } from '@/lib/metadata';
import { getRoute, routeTitle } from '@/lib/site';
import { turnstileMode } from '@/lib/turnstile';

import { sendSponsorshipRequest } from './actions';
import { sponsorshipFormAvailable } from './availability';

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
      <SponsorshipSection
        action={sponsorshipFormAvailable() ? sendSponsorshipRequest : null}
        turnstileSiteKey={
          turnstileMode() === 'on' ? (publicEnv.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null) : null
        }
        socials={socialLinks}
      />
    </>
  );
}
