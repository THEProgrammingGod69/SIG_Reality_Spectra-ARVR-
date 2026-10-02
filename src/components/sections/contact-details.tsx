import { Mail, MapPin, Phone, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { ButtonLink } from '@/components/ui/button';
import { Card, CardBody, CardMedia } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { Icon } from '@/components/ui/icon';
import { Section } from '@/components/ui/section';
import { Text } from '@/components/ui/text';
import type { ContactInfo } from '@/lib/schemas/content';

type ContactDetailsProps = Pick<ContactInfo, 'email' | 'phone' | 'address' | 'map'>;

/** What a detail shows while it is not supplied yet (D-024): text, never a link. */
function ComingSoon() {
  return (
    <Text as="span" size="sm" tone="subtle" data-placeholder>
      Coming soon
    </Text>
  );
}

function Detail({
  icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-(--color-surface-raised) text-(--color-muted)">
        <Icon icon={icon} size="md" />
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <dt className="font-mono text-label text-(--color-muted) uppercase">{label}</dt>
        <dd className="wrap-anywhere text-(--color-text)">{children}</dd>
      </div>
    </div>
  );
}

/**
 * Contact page: email, phone and address, and the map. Anything not yet in
 * src/content/contact.json shows a "Coming soon" placeholder and the map a
 * placeholder panel; `pnpm check:launch` lists them until they are filled.
 */
export function ContactDetails({ email, phone, address, map }: ContactDetailsProps) {
  return (
    <Section labelledBy="contact-details" className="pb-0">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Card>
          <CardBody className="gap-8 p-8">
            <Heading level={2} size="sm" id="contact-details">
              Get in touch
            </Heading>
            <dl className="flex flex-col gap-6">
              <Detail icon={Mail} label="Email">
                {email ? <a href={`mailto:${email}`}>{email}</a> : <ComingSoon />}
              </Detail>
              <Detail icon={Phone} label="Phone">
                {phone ? (
                  <a href={`tel:${phone.replace(/[^+0-9]/g, '')}`}>{phone}</a>
                ) : (
                  <ComingSoon />
                )}
              </Detail>
              <Detail icon={MapPin} label="Address">
                {address ?? <ComingSoon />}
              </Detail>
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardMedia ratio="16/9" className="h-full min-h-64">
            {map.embedUrl ? (
              <iframe
                src={map.embedUrl}
                title="Map showing where to find the club"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 size-full border-0"
              />
            ) : (
              <div
                data-placeholder
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center"
              >
                <Icon icon={MapPin} size="lg" className="text-(--color-muted)" />
                <Text size="sm" tone="muted">
                  Map coming soon
                </Text>
                {map.url ? (
                  <ButtonLink href={map.url} external variant="secondary" size="sm">
                    Open in Google Maps
                  </ButtonLink>
                ) : null}
              </div>
            )}
          </CardMedia>
        </Card>
      </div>
    </Section>
  );
}
