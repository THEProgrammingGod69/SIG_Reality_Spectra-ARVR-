import Link from 'next/link';

import { Container } from '@/components/ui/container';
import { BrandBadge } from '@/components/ui/logo';
import { Eyebrow, Text } from '@/components/ui/text';
import { contactChannels, routesInGroup, siteConfig, socialLinks } from '@/lib/site';

const footerGroups = [
  { id: 'explore', heading: 'Explore' },
  { id: 'involve', heading: 'Get involved' },
  { id: 'connect', heading: 'Connect' },
] as const;

/**
 * Site footer. Every public page is linked here from `siteRoutes` — which also
 * makes it the navigation for visitors without JavaScript. Contact channels
 * appear only once supplied (OPEN_ITEMS #7). "VIT Pune" appears as plain text
 * in the credit line: VIT has no logo or branding rules for the club to follow.
 */
export function SiteFooter() {
  const socials = socialLinks();
  const email = contactChannels.email;

  return (
    <footer data-site-footer className="border-t border-(--color-border)">
      <Container className="grid gap-12 py-16 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="flex flex-col items-start gap-5">
          <BrandBadge />
          <Text size="sm" tone="muted" className="max-w-xs">
            {siteConfig.description}
          </Text>
          {email || socials.length > 0 ? (
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-body-sm">
              {email ? (
                <li>
                  <a href={`mailto:${email}`} className="text-(--color-text)">
                    {email}
                  </a>
                </li>
              ) : null}
              {socials.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-(--color-muted) hover:text-(--color-text)"
                  >
                    {social.label}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
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
          <Eyebrow>Special Interest Group · {siteConfig.parentOrganisation}</Eyebrow>
          <Eyebrow>© {siteConfig.name}</Eyebrow>
        </Container>
      </div>
    </footer>
  );
}
