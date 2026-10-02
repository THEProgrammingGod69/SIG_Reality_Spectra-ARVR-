import { Stagger } from '@/components/motion/stagger';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { QrCode } from '@/components/ui/qr-code';
import { Section } from '@/components/ui/section';
import { Text } from '@/components/ui/text';
import type { LiveSocial } from '@/lib/content';

type SocialChannelsProps = {
  socials: readonly LiveSocial[];
};

/**
 * Contact page: the club's channels, each with a button and — for channels
 * marked `qr` — a QR code generated from the same link. QR codes show from
 * `md` up: on a phone the button is the way in (a phone cannot scan its own
 * screen). Renders nothing while no channel is set.
 */
export function SocialChannels({ socials }: SocialChannelsProps) {
  if (socials.length === 0) return null;

  return (
    <Section labelledBy="social-channels" className="pb-0">
      <Heading level={2} size="md" id="social-channels">
        Follow and join
      </Heading>
      <Stagger
        as="ul"
        className="mt-8 grid grid-cols-[repeat(auto-fill,minmax(min(100%,16rem),1fr))] gap-6"
      >
        {socials.map((social) => (
          <Card key={social.id} as="li">
            <CardBody className="items-start gap-5">
              {social.qr ? (
                <QrCode
                  value={social.href}
                  label={`QR code for ${social.label}`}
                  className="hidden size-36 md:block"
                />
              ) : null}
              <div className="flex flex-col gap-1">
                <Heading level={3} size="sm">
                  {social.label}
                </Heading>
                {social.handle ? (
                  <Text size="sm" tone="muted">
                    {social.handle}
                  </Text>
                ) : null}
              </div>
              <ButtonLink
                href={social.href}
                external
                variant="secondary"
                size="sm"
                className="mt-auto"
              >
                {social.action}
              </ButtonLink>
            </CardBody>
          </Card>
        ))}
      </Stagger>
    </Section>
  );
}
