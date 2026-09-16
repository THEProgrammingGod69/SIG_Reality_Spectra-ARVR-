import type { NextConfig } from 'next';

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
     * Admin-uploaded images (event posters, event photos, team photos) are served
     * from the club's public Vercel Blob store.
     */
    remotePatterns: [{ protocol: 'https', hostname: '*.public.blob.vercel-storage.com' }],
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
