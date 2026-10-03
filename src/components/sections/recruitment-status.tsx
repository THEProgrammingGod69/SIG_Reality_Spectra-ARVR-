import { FileText } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { QrCode } from '@/components/ui/qr-code';
import { Section } from '@/components/ui/section';
import { Text } from '@/components/ui/text';
import type { LiveSocial } from '@/lib/content';
import type { PublicRecruitment } from '@/lib/schemas/recruitment';

import { SocialButtons } from './social-buttons';

type RecruitmentStatusProps = {
  recruitment: PublicRecruitment;
  /** Where to follow the club while recruitment is closed. */
  socials: readonly LiveSocial[];
};

/**
 * Recruitment: open → the application form (button, and a QR code to scan
 * from a laptop screen) and the roles-and-responsibilities PDF, or an honest
 * "coming soon" line until it is uploaded (D-028); closed → a calm note and
 * where to follow the club. The settings are managed in /admin/recruitment.
 */
export function RecruitmentStatus({ recruitment, socials }: RecruitmentStatusProps) {
  const formUrl = recruitment.open ? recruitment.formUrl : null;

  return (
    <Section labelledBy="recruitment-status" className="pb-0">
      <Card featured={formUrl !== null}>
        <CardBody className="gap-6 p-8 md:flex-row md:items-center md:justify-between">
          <div className="flex max-w-prose flex-col gap-4">
            <Badge tone={formUrl ? 'success' : 'neutral'} className="self-start">
              {formUrl ? 'Recruitment open' : 'Recruitment closed'}
            </Badge>
            <Heading level={2} size="md" id="recruitment-status">
              {formUrl ? 'Applications are open' : 'Applications are closed right now'}
            </Heading>
            <Text tone="muted">
              {formUrl
                ? 'Pick the domains that interest you below, then apply through the club’s application form.'
                : 'Follow the club to hear when the next recruitment drive opens.'}
            </Text>
            {formUrl ? (
              <div className="flex flex-col gap-4">
                <ButtonLink href={formUrl} external variant="star" size="lg" className="self-start">
                  Apply now
                </ButtonLink>
                {recruitment.rolesPdfUrl ? (
                  <ButtonLink
                    href={recruitment.rolesPdfUrl}
                    external
                    variant="secondary"
                    icon={FileText}
                    className="self-start"
                  >
                    Roles &amp; responsibilities (PDF)
                  </ButtonLink>
                ) : (
                  <Text size="sm" tone="muted">
                    The roles and responsibilities document is coming soon.
                  </Text>
                )}
              </div>
            ) : (
              <SocialButtons socials={socials} />
            )}
          </div>

          {formUrl ? (
            <figure className="hidden shrink-0 flex-col items-center gap-3 md:flex">
              <QrCode
                value={formUrl}
                label="QR code for the application form"
                className="size-40"
              />
              <figcaption className="font-mono text-label text-(--color-muted) uppercase">
                Scan to apply
              </figcaption>
            </figure>
          ) : null}
        </CardBody>
      </Card>
    </Section>
  );
}
