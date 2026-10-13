import { ArrowUp } from 'lucide-react';
import Link from 'next/link';

import { Reveal } from '@/components/motion/reveal';
import { Container } from '@/components/ui/container';
import { Icon } from '@/components/ui/icon';
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

/** "SIG Reality Spectra" → "Reality Spectra": the wordmark drops the "SIG" the badge carries. */
const wordmark = siteConfig.name.replace(/^SIG\s+/, '');

/**
 * Site footer. Every public page is linked here from `siteRoutes` — which also
 * makes it the navigation for visitors without JavaScript. Contact channels
 * come from src/content/contact.json and appear only once set. "VIT Pune"
 * appears as plain text in the credit line: VIT has no logo or branding rules
 * for the club to follow.
 *
 * It closes on the club's name as a wordmark across the full width (D-037),
 * lit from above and fading into the floor — decorative (`aria-hidden`), the
 * badge already names the club — and a way back to the top.
 */
export function SiteFooter() {
  return (
    <footer
      data-site-footer
      className="relative isolate overflow-hidden border-t border-(--color-border)"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-(image:--gradient-rim)"
      />
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
                      // `pe-5` holds room for the label's 1.25rem shift, so the
                      // focus ring surrounds the label where it ends up.
                      className="group/link inline-flex items-center gap-2 pe-5 text-(--color-text-body) hover:text-(--color-text)"
                    >
                      <span
                        aria-hidden="true"
                        className="h-px w-3 origin-left scale-x-0 bg-(--color-accent) transition-transform duration-(--dur-short) ease-out-expo group-hover/link:scale-x-100 group-focus-visible/link:scale-x-100"
                      />
                      <span className="-ms-5 transition-transform duration-(--dur-short) ease-out-expo group-hover/link:translate-x-5 group-focus-visible/link:translate-x-5">
                        {route.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </Container>

      <Container aria-hidden="true" className="select-none">
        <Reveal>
          {/* Padded below so the gradient (the text's only fill) reaches the
              descenders of "y" and "p", which hang under the tight line box. */}
          <p className="bg-linear-to-b from-(--color-text)/30 to-(--color-text)/5 bg-clip-text pb-[0.22em] text-center font-display text-display-3xl whitespace-nowrap text-transparent">
            {wordmark}
          </p>
        </Reveal>
      </Container>

      <div className="border-t border-(--color-border)">
        <Container className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <Eyebrow>{clubCredit}</Eyebrow>
          <div className="flex items-center gap-6">
            <Eyebrow>© {siteConfig.name}</Eyebrow>
            <a
              href="#main-content"
              className="group/top inline-flex items-center gap-2 font-mono text-label text-(--color-muted) uppercase hover:text-(--color-text)"
            >
              Back to top
              <Icon
                icon={ArrowUp}
                size="sm"
                className="transition-transform duration-(--dur-short) ease-out-expo group-hover/top:-translate-y-0.5"
              />
            </a>
          </div>
        </Container>
      </div>
    </footer>
  );
}
