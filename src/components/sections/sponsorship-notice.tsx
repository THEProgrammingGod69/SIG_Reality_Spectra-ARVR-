import { Handshake } from 'lucide-react';

import { EmptyState } from '@/components/ui/empty-state';
import { Heading } from '@/components/ui/heading';
import { Section } from '@/components/ui/section';
import { Text } from '@/components/ui/text';
import type { LiveSocial } from '@/lib/content';

import { SocialButtons } from './social-buttons';

type SponsorshipNoticeProps = {
  socials: readonly LiveSocial[];
};

/**
 * Contact page: the sponsorship and collaboration area.
 *
 * The request form needs its server action, Turnstile and the admin inbox,
 * which Stage 8 builds. Until then this shows an honest notice with the
 * channels to use instead — never a form that looks real but goes nowhere
 * (D-024). Stage 8 replaces the notice with SponsorshipForm.
 */
export function SponsorshipNotice({ socials }: SponsorshipNoticeProps) {
  return (
    <Section labelledBy="sponsorship">
      <div className="max-w-prose">
        <Heading level={2} id="sponsorship">
          Sponsorship and collaboration
        </Heading>
        <Text tone="muted" className="mt-4">
          Organisations, speakers and partners who want to work with the club can reach out for
          sponsorships, workshops and collaborations.
        </Text>
      </div>
      <EmptyState
        icon={Handshake}
        title="The request form opens soon"
        description="Until then, message the club through one of its channels and the team will get back to you."
        className="mt-10"
        action={<SocialButtons socials={socials} className="justify-center" />}
      />
    </Section>
  );
}
