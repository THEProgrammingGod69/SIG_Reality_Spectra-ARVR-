import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { cacheLife } from 'next/cache';
import { ImageResponse } from 'next/og';

import { siteInfo } from '@/lib/content';
import { OG_IMAGE_SIZE, ogImageSlug } from '@/lib/metadata';
import { clubCredit, routeTitle, siteConfig, siteRoutes } from '@/lib/site';
import { TOKEN_VALUES } from '@/lib/token-values';

/**
 * Each public page's share image (OpenGraph and Twitter cards, D-033): the
 * page's title and description on the Orbit Lab palette, with the club's
 * mark and a low spectrum horizon. Drawn once per page at build time — the
 * six slugs are listed below — and served as a static PNG: the drawing sits
 * in a `'use cache'` helper, because reading the font files would otherwise
 * make the handler run on every request (Cache Components).
 *
 * The image is a fixed 1200×630 canvas, so its layout is in pixels; colours
 * are the mirrored design tokens (src/lib/token-values.ts), never literals.
 * The type is Space Grotesk (D-002), from the static TTFs in src/assets/fonts
 * (the image renderer cannot read the site's WOFF2 files). Their paths are
 * written out in full so the deployment's file tracing includes them.
 */

export function generateStaticParams() {
  return siteRoutes.map((route) => ({ page: ogImageSlug(route) }));
}

export async function GET(_request: Request, { params }: RouteContext<'/og/[page]'>) {
  const png = await drawShareImage((await params).page);
  if (!png) return new Response('Not found', { status: 404 });
  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
}

/** The PNG for one page's slug, or null for a slug that is not a page. */
async function drawShareImage(slug: string): Promise<Uint8Array<ArrayBuffer> | null> {
  'use cache';
  // Content only changes with a deploy, which rebuilds every image anyway.
  cacheLife('max');

  const route = siteRoutes.find((candidate) => ogImageSlug(candidate) === slug);
  if (!route) return null;

  const isHome = route.href === '/';
  const title = isHome ? siteConfig.name : routeTitle(route);
  const description = isHome ? siteInfo.tagline : route.description;

  const [bold, medium, mark] = await Promise.all([
    readFile(join(process.cwd(), 'src/assets/fonts/SpaceGrotesk-Bold.ttf')),
    readFile(join(process.cwd(), 'src/assets/fonts/SpaceGrotesk-Medium.ttf')),
    readFile(join(process.cwd(), 'src/assets/brand/logo-mark.png')),
  ]);
  const markSrc = `data:image/png;base64,${mark.toString('base64')}`;
  const t = TOKEN_VALUES;

  const image = new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 72,
        backgroundColor: t.bg,
        fontFamily: 'Space Grotesk',
        position: 'relative',
      }}
    >
      {/* The low spectrum horizon of the hero (D-001), kept to the bottom edge. */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 260,
          display: 'flex',
          backgroundImage: `radial-gradient(ellipse 70% 100% at 50% 100%, ${t['spectra-violet']}66 0%, ${t['spectra-magenta']}22 45%, transparent 75%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 4,
          display: 'flex',
          backgroundImage: `linear-gradient(90deg, ${t['spectra-magenta']}, ${t['spectra-violet']}, ${t['spectra-azure']})`,
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- the image renderer needs a plain <img> */}
        <img src={markSrc} width={72} height={72} alt="" style={{ borderRadius: 36 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 30, fontWeight: 700, color: t.text }}>{siteConfig.name}</span>
          <span
            style={{
              fontSize: 18,
              fontWeight: 500,
              color: t.muted,
              letterSpacing: 3,
              textTransform: 'uppercase',
            }}
          >
            {clubCredit}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 940 }}>
        <span
          style={{
            fontSize: isHome ? 88 : 76,
            fontWeight: 700,
            lineHeight: 1.05,
            color: t.text,
            letterSpacing: -2,
          }}
        >
          {title}
        </span>
        <span style={{ fontSize: 32, fontWeight: 500, lineHeight: 1.35, color: t.muted }}>
          {description}
        </span>
      </div>

      <span
        style={{
          fontSize: 20,
          fontWeight: 500,
          color: t['spectra-violet'],
          letterSpacing: 3,
          textTransform: 'uppercase',
        }}
      >
        {siteInfo.motto}
      </span>
    </div>,
    {
      ...OG_IMAGE_SIZE,
      fonts: [
        { name: 'Space Grotesk', data: bold, weight: 700, style: 'normal' },
        { name: 'Space Grotesk', data: medium, weight: 500, style: 'normal' },
      ],
    },
  );
  return new Uint8Array(await image.arrayBuffer());
}
