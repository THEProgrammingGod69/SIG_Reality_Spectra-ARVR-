import type { NextConfig } from 'next';

import {
  MEDIA_FILE_HEADERS,
  NOINDEX_HEADERS,
  type SecurityOptions,
  securityHeaders,
} from './src/lib/security-headers';

/**
 * The public origin of the club's R2 bucket (custom domain or r2.dev URL).
 * Read here, at build time, so next/image accepts uploaded images; the value is
 * validated with the rest of the environment in src/lib/env.ts.
 */
function mediaHostname(): string | null {
  try {
    return process.env.R2_PUBLIC_BASE_URL ? new URL(process.env.R2_PUBLIC_BASE_URL).hostname : null;
  } catch {
    return null;
  }
}

const mediaHost = mediaHostname();

/** Where the browser PUTs uploads: the account's R2 endpoint (presigned URLs). */
const uploadOrigin = /^[a-f0-9]{32}$/.test(process.env.R2_ACCOUNT_ID ?? '')
  ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
  : null;

const security: SecurityOptions = {
  development: process.env.NODE_ENV === 'development',
  https: (process.env.NEXT_PUBLIC_SITE_URL ?? '').startsWith('https://'),
  mediaOrigin: mediaHost ? `https://${mediaHost}` : null,
  uploadOrigin,
  netlifyPreview: ['deploy-preview', 'branch-deploy'].includes(process.env.CONTEXT ?? ''),
};

const nextConfig: NextConfig = {
  /**
   * Statically typed <Link href> and router calls.
   * Catches a dead internal link at build time instead of in production.
   */
  typedRoutes: true,

  /**
   * Cache Components: data is dynamic by default and cached explicitly with the
   * `'use cache'` directive + `cacheTag()`. This is what makes `updateTag()` in a
   * Server Action refresh exactly the public pages an admin just changed, with no
   * redeploy. It also means:
   *   - request-time values (`new Date()`, cookies, headers) must be read after
   *     `await connection()` / inside a <Suspense> boundary, never inside a cached function;
   *   - the Node.js runtime is required (no `runtime = 'edge'`).
   */
  cacheComponents: true,

  /**
   * `pnpm build` must fail on a type error. Never set `ignoreBuildErrors`.
   * (Next.js 16 no longer runs ESLint during `next build` — `pnpm lint` does that.)
   */
  typescript: {
    ignoreBuildErrors: false,
  },

  images: {
    /**
     * Admin-uploaded images (event posters and photos, gallery and team photos)
     * are served from the club's public R2 bucket: its r2.dev URL, or the custom
     * domain in R2_PUBLIC_BASE_URL.
     */
    remotePatterns: [
      { protocol: 'https', hostname: '*.r2.dev' },
      ...(mediaHost ? [{ protocol: 'https' as const, hostname: mediaHost }] : []),
    ],
    // Next.js 16 default is [75]; the project renders every image at one quality.
    qualities: [75],
    formats: ['image/avif', 'image/webp'],
  },

  // Do not leak the framework version in response headers.
  poweredByHeader: false,

  /**
   * Security headers on every response (Stage 9, D-033): CSP, HSTS, framing,
   * sniffing, referrer and permissions policies (src/lib/security-headers.ts),
   * plus `X-Robots-Tag: noindex` on the admin panel and the API (rule 7), and
   * a sandboxing CSP on uploaded files the site serves itself.
   */
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders(security) },
      { source: '/admin/:path*', headers: NOINDEX_HEADERS },
      { source: '/api/:path*', headers: NOINDEX_HEADERS },
      // Last, so its CSP replaces the page one for uploaded files.
      { source: '/api/local-media/:path*', headers: MEDIA_FILE_HEADERS },
    ];
  },

  // Trailing slashes off so /events and /events/ never split analytics or cache tags.
  trailingSlash: false,
};

export default nextConfig;
