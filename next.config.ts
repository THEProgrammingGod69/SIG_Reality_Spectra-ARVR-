import type { NextConfig } from 'next';

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

  // Trailing slashes off so /events and /events/ never split analytics or cache tags.
  trailingSlash: false,
};

export default nextConfig;
