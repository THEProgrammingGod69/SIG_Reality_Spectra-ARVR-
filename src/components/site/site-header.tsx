'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';

import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { BrandMark } from '@/components/ui/logo';
import { cn } from '@/lib/cn';
import type { Channels } from '@/lib/content';
import { ctaNavRoutes, getRoute, primaryNavRoutes, siteConfig } from '@/lib/site';

import { MobileMenuPanel, MobileMenuToggle, useMobileMenu } from './mobile-menu';
import { PillNav } from './pill-nav';

/** The logo links Home, so Home is not repeated as a pill. */
const pillItems = primaryNavRoutes.filter((route) => route.href !== '/');
const homeRoute = getRoute('/');

function subscribeToScroll(onChange: () => void) {
  window.addEventListener('scroll', onChange, { passive: true });
  return () => window.removeEventListener('scroll', onChange);
}
const isScrolled = () => window.scrollY > 0;

type SiteHeaderProps = {
  channels: Channels;
  recruitmentOpen: boolean;
};

/**
 * Site header: fixed, transparent over the top of the page, glass once the
 * page scrolls. The glass is a separate layer whose `opacity` changes (rule 4),
 * not an animated background.
 *
 * lg and up: logo · PillNav · Recruitment CTA. Below lg: logo · CTA (from sm)
 * · Menu toggle, with the MobileMenu panel behind the header row.
 *
 * The CTA shows a status dot while recruitment is open. The layout passes the
 * status (interim content now, admin settings from Stage 8) and the contact
 * channels as props, so no server-only content module reaches the browser.
 */
export function SiteHeader({ channels, recruitmentOpen }: SiteHeaderProps) {
  const scrolled = useSyncExternalStore(subscribeToScroll, isScrolled, () => false);
  const { state: menu, refs: menuRefs } = useMobileMenu();

  return (
    <header
      data-scrolled={scrolled || undefined}
      className="fixed inset-x-0 top-0 z-(--z-header) h-header"
    >
      <div
        aria-hidden="true"
        className={cn(
          'absolute inset-0 border-b border-(--color-border) bg-(--color-glass) opacity-0 backdrop-blur-glass transition-opacity duration-(--dur-short) ease-out-expo',
          scrolled && 'opacity-100',
        )}
      />

      <MobileMenuPanel menu={menu} rootRef={menuRefs.root} channels={channels} />

      <Container className="relative flex h-full items-center justify-between gap-6">
        <Link href={homeRoute.href} className="flex items-center gap-3 rounded-full">
          <BrandMark alt="" preload />
          <span className="font-display text-body font-medium text-(--color-text)">
            {siteConfig.name}
          </span>
        </Link>

        <PillNav items={pillItems} />

        <div className="flex items-center gap-2">
          {ctaNavRoutes.map((route) => (
            <ButtonLink
              key={route.href}
              href={route.href}
              size="sm"
              aria-current={menu.pathname === route.href ? 'page' : undefined}
              className="hidden sm:inline-flex"
            >
              {recruitmentOpen ? (
                <span
                  aria-hidden="true"
                  className="size-1.5 rounded-full bg-(--color-accent-contrast)"
                />
              ) : null}
              {route.label}
              {recruitmentOpen ? <span className="sr-only"> (open now)</span> : null}
            </ButtonLink>
          ))}
          <MobileMenuToggle
            menu={menu}
            toggleRef={menuRefs.toggle}
            labelRef={menuRefs.label}
            barHRef={menuRefs.barH}
            barVRef={menuRefs.barV}
          />
        </div>
      </Container>
    </header>
  );
}
