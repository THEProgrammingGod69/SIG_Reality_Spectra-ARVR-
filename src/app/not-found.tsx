import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Heading } from '@/components/ui/heading';
import { BrandMark } from '@/components/ui/logo';
import { Eyebrow, Text } from '@/components/ui/text';
import { getRoute, siteConfig } from '@/lib/site';

/**
 * Root 404. It renders outside the public site layout (no header or footer),
 * so it carries its own <main> landmark and a way home.
 */
export default function NotFound() {
  return (
    <main id="main-content" className="flex flex-1 items-center py-section">
      <Container width="prose" className="flex flex-col items-start">
        <BrandMark alt="" sizes="3.5rem" className="size-14" />
        <Eyebrow className="mt-8">Error 404</Eyebrow>
        <Heading level={1} className="mt-3">
          Page not found
        </Heading>
        <Text size="lg" tone="muted" className="mt-4">
          That page does not exist, or it is no longer published.
        </Text>
        <ButtonLink href={getRoute('/').href} className="mt-10">
          Back to {siteConfig.shortName}
        </ButtonLink>
      </Container>
    </main>
  );
}
