import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import { publicEnv } from '@/lib/env.public';
import { siteConfig } from '@/lib/site';

import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

/**
 * Root metadata. Every page inherits this and overrides only what it needs.
 * `metadataBase` makes relative OpenGraph image paths resolve correctly.
 * Stage 3 swaps the fonts for the approved brand typefaces; Stage 9 adds the
 * generated OpenGraph images.
 */
export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.NEXT_PUBLIC_SITE_URL),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: {
    type: 'website',
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    url: publicEnv.NEXT_PUBLIC_SITE_URL,
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
};

export const viewport: Viewport = {
  // Browser chrome colour. Metadata cannot read CSS variables, so this mirrors
  // `--color-bg` in globals.css — change both together.
  themeColor: '#07060c',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    // `data-scroll-behavior="smooth"`: globals.css enables smooth scrolling for
    // in-page anchors, so Next.js must switch it off during route changes to
    // keep navigation instant (a Next.js 16 opt-in).
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
