import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /**
   * Statically typed <Link href> and router calls.
   * Catches a dead internal link at build time instead of in production.
   */
  typedRoutes: true,

  /**
   * `pnpm build` must fail on a type error. Never set `ignoreBuildErrors`.
   * (Next.js 16 no longer runs ESLint during `next build` — `pnpm lint` does that.)
   */
  typescript: {
    ignoreBuildErrors: false,
  },

  images: {
    /**
     * Remote image hosts. Vercel Blob is added in Stage 5 once the store exists:
     *   { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' }
     */
    remotePatterns: [],
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
