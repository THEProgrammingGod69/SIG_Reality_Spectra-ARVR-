import Link from 'next/link';

import { Container } from '@/components/ui/container';
import { BrandBadge } from '@/components/ui/logo';
import { Eyebrow, Text } from '@/components/ui/text';
import { siteChannels, siteInfo } from '@/lib/content';
import { clubCredit, routesInGroup, siteConfig } from '@/lib/site';

import { ChannelLinks } from './channel-links';

const footerGroups = [
  { id: 'explore', heading: 'Explore' },
  { id: 'involve', heading: 'Get involved' },
  { id: 'connect', heading: 'Connect' },
] as const;

/**
 * Site footer. Every public page is linked here from `siteRoutes` — which also
 * makes it the navigation for visitors without JavaScript. Contact channels
 * come from src/content/contact.json and appear only once set. "VIT Pune"
 * appears as plain text in the credit line: VIT has no logo or branding rules
 * for the club to follow.
 */
export function SiteFooter() {
  return (
    <footer data-site-footer className="border-t border-(--color-border)">
      <Container className="grid gap-12 py-16 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="flex flex-col items-start gap-5">
          <BrandBadge />
          <Text size="sm" tone="muted" className="max-w-xs">
            {siteInfo.positioning}
          </Text>
          <ChannelLinks channels={siteChannels} />
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {footerGroups.map((group) => (
            <nav key={group.id} aria-label={group.heading}>
              <h2 className="font-mono text-label text-(--color-muted) uppercase">
                {group.heading}
              </h2>
              <ul className="mt-4 flex flex-col gap-3 text-body-sm">
                {routesInGroup(group.id).map((route) => (
                  <li key={route.href}>
                    <Link
                      href={route.href}
                      className="text-(--color-text-body) hover:text-(--color-text)"
                    >
                      {route.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </Container>

      <div className="border-t border-(--color-border)">
        <Container className="flex flex-col gap-2 py-6 sm:flex-row sm:items-center sm:justify-between">
          <Eyebrow>{clubCredit}</Eyebrow>
          <Eyebrow>© {siteConfig.name}</Eyebrow>
        </Container>
      </div>
    </footer>
  );
}
