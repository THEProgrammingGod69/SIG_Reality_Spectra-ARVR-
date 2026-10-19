import { Handshake, Inbox, Mail } from 'lucide-react';
import type { ComponentProps } from 'react';

import { Reveal } from '@/components/motion/reveal';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { HudCorners } from '@/components/ui/hud-corners';
import { Section } from '@/components/ui/section';
import { Text } from '@/components/ui/text';
import type { LiveSocial } from '@/lib/content';
import { SPONSORSHIP_TYPES } from '@/lib/schemas/sponsorship';

import { SectionHeading } from './section-heading';
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

/** How a request travels — the facts of D-008, in the visitor's words. */
const steps = [
  { icon: Inbox, text: 'Your request goes straight to the club’s admin inbox.' },
  { icon: Mail, text: 'The team reads every request and replies by email.' },
] as const;

/**
 * Contact page: the sponsorship and collaboration request form. Requests go
 * to the admin inbox (/admin/sponsorships); there is no email (D-008).
 *
 * From `lg` the pitch sits beside the form (D-037): what the club welcomes
 * (the request types the form offers) and how a request is handled.
 */
export function SponsorshipSection({ action, turnstileSiteKey, socials }: SponsorshipSectionProps) {
  return (
    <Section labelledBy="sponsorship">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
        <div className="flex flex-col gap-8 lg:sticky lg:top-24">
          <SectionHeading
            id="sponsorship"
            eyebrow="Partner with the club"
            title="Sponsorship and collaboration"
            highlight="collaboration"
            lead="Organisations, speakers and partners who want to work with the club can send a request for sponsorships, workshops and collaborations. The team replies by email."
          />
          <Reveal className="flex flex-col gap-6">
            <ul aria-label="What you can propose" className="flex flex-wrap gap-2">
              {SPONSORSHIP_TYPES.map((type) => (
                <li
                  key={type.id}
                  className="rounded-full border border-(--color-border-strong) px-3 py-1 font-mono text-label text-(--color-text-body) uppercase"
                >
                  {type.label}
                </li>
              ))}
            </ul>
            <ul className="flex flex-col gap-4">
              {steps.map((step) => (
                <li key={step.text} className="flex items-start gap-3">
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-(--color-border-strong) text-(--color-accent)">
                    <Icon icon={step.icon} size="sm" />
                  </span>
                  <Text size="sm" tone="muted" className="pt-2">
                    {step.text}
                  </Text>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal className="group/form relative">
          {/* The HUD locks onto the form while the visitor fills it in (D-038). */}
          {action ? (
            <HudCorners
              // Within the page gutter at every width, at rest and while it settles.
              className="-inset-2 scale-[0.97] text-(--color-accent) opacity-0 transition-[scale,opacity] duration-(--dur-medium) ease-out-expo group-focus-within/form:scale-100 group-focus-within/form:opacity-100"
              cornerClassName="size-5"
            />
          ) : null}
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
      </div>
    </Section>
  );
}
