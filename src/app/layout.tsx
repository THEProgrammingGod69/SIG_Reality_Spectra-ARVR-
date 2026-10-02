import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono, Space_Grotesk } from 'next/font/google';

import { siteInfo } from '@/lib/content';
import { publicEnv } from '@/lib/env.public';
import { defaultTitle, OG_LOCALE, titleTemplate } from '@/lib/metadata';
import { siteConfig } from '@/lib/site';

import './globals.css';

/*
 * Brand typefaces (D-002), self-hosted by next/font: four files in total —
 * Space Grotesk 500 and 700, Inter (one variable file) and JetBrains Mono 500.
 * Each exposes a `--font-*-face` variable that the `--font-*` tokens in
 * globals.css wrap with fallbacks.
 */
const display = Space_Grotesk({
  weight: ['500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-grotesk-face',
});

const sans = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter-face',
});

const mono = JetBrains_Mono({
  weight: '500',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono-face',
});

/**
 * Root metadata: the defaults for pages that set none (404, admin). Public
 * pages state their own complete set through `pageMetadata()`. `metadataBase`
 * makes relative URLs absolute. The favicon and Apple icon are `icon.png` and
 * `apple-icon.png` beside this file; Stage 9 adds generated OpenGraph images.
 */
export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.NEXT_PUBLIC_SITE_URL),
  title: { default: defaultTitle, template: titleTemplate },
  description: siteInfo.positioning,
  applicationName: siteConfig.name,
  openGraph: {
    type: 'website',
    siteName: siteConfig.name,
    locale: OG_LOCALE,
    title: defaultTitle,
    description: siteInfo.positioning,
  },
  twitter: { card: 'summary_large_image', title: defaultTitle, description: siteInfo.positioning },
};

export const viewport: Viewport = {
  // Browser chrome colour. Metadata cannot read CSS variables, so this mirrors
  // `--color-bg` in globals.css; a unit test fails if the two drift apart.
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
      className={`${display.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
