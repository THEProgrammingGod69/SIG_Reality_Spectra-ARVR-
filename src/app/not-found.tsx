import { SplitText } from '@/components/motion/split-text';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Heading } from '@/components/ui/heading';
import { LabBackdrop } from '@/components/ui/lab-backdrop';
import { BrandMark } from '@/components/ui/logo';
import { Eyebrow, Text } from '@/components/ui/text';
import { getRoute, siteConfig } from '@/lib/site';

/**
 * Root 404. It renders outside the public site layout (no header or footer),
 * so it carries its own <main> landmark and a way home.
 *
 * Lost in the lab (D-037): the orbit centred behind a hollow "404", the title
 * rising into place like every page's.
 */
export default function NotFound() {
  return (
    <main
      id="main-content"
      className="relative isolate flex flex-1 items-center overflow-hidden py-section"
    >
      <LabBackdrop align="center" />
      <Container width="prose" className="flex flex-col items-start">
        <BrandMark alt="" sizes="3.5rem" className="size-14" />
        <p
          aria-hidden="true"
          className="mt-10 animate-intro-in font-display text-display-3xl text-outline"
        >
          404
        </p>
        <Eyebrow className="mt-6">Error 404</Eyebrow>
        <Heading level={1} className="mt-3">
          <SplitText text="Page not found" play="load" />
        </Heading>
        <Text size="lg" tone="muted" className="mt-4 animate-intro-in">
          That page does not exist, or it is no longer published.
        </Text>
        <ButtonLink href={getRoute('/').href} className="mt-10" magnetic>
          Back to {siteConfig.shortName}
        </ButtonLink>
      </Container>
    </main>
  );
}
