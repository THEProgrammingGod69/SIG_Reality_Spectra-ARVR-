import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { QrCode } from '@/components/ui/qr-code';
import { Section } from '@/components/ui/section';
import { Text } from '@/components/ui/text';
import type { LiveSocial } from '@/lib/content';
import type { InterimRecruitment } from '@/lib/schemas/content';

import { SocialButtons } from './social-buttons';

type RecruitmentStatusProps = {
  recruitment: InterimRecruitment;
  /** Where to follow the club while recruitment is closed. */
  socials: readonly LiveSocial[];
};

/**
 * Recruitment: open → the application form (button, and a QR code to scan
 * from a laptop screen); closed → a calm note and where to follow the club.
 *
 * INTERIM (D-024): status and form link come from src/content/recruitment.json.
 * Stage 8 feeds the same props from the admin-managed recruitment settings and
 * adds the roles-and-responsibilities PDF.
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
              <ButtonLink href={formUrl} external variant="star" size="lg" className="self-start">
                Apply now
              </ButtonLink>
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
