import { Handshake } from 'lucide-react';
import type { ComponentProps } from 'react';

import { Reveal } from '@/components/motion/reveal';
import { EmptyState } from '@/components/ui/empty-state';
import { Heading } from '@/components/ui/heading';
import { Section } from '@/components/ui/section';
import { Text } from '@/components/ui/text';
import type { LiveSocial } from '@/lib/content';
import { SPONSORSHIP_TYPES } from '@/lib/schemas/sponsorship';

import { SocialButtons } from './social-buttons';
import { SponsorshipForm } from './sponsorship-form';

type SponsorshipSectionProps = {
  /**
   * The form's Server Action, or null where the form cannot be offered (no
   * data store, or spam protection half set up): then the section says so and
   * lists the club's channels — never a form that goes nowhere (D-024).
   */
  action: ComponentProps<typeof SponsorshipForm>['action'] | null;
  turnstileSiteKey: string | null;
  socials: readonly LiveSocial[];
};

/**
 * Contact page: the sponsorship and collaboration request form. Requests go
 * to the admin inbox (/admin/sponsorships); there is no email (D-008).
 */
export function SponsorshipSection({ action, turnstileSiteKey, socials }: SponsorshipSectionProps) {
  return (
    <Section labelledBy="sponsorship">
      <Reveal className="max-w-prose">
        <Heading level={2} id="sponsorship">
          Sponsorship and collaboration
        </Heading>
        <Text tone="muted" className="mt-4">
          Organisations, speakers and partners who want to work with the club can send a request for
          sponsorships, workshops and collaborations. The team replies by email.
        </Text>
      </Reveal>
      <Reveal className="mt-10 max-w-prose">
        {action ? (
          <SponsorshipForm
            action={action}
            types={SPONSORSHIP_TYPES}
            turnstileSiteKey={turnstileSiteKey}
          />
        ) : (
          <EmptyState
            icon={Handshake}
            title="The request form is not available right now"
            description="Until it is, message the club through one of its channels and the team will get back to you."
            action={<SocialButtons socials={socials} className="justify-center" />}
          />
        )}
      </Reveal>
    </Section>
  );
}
