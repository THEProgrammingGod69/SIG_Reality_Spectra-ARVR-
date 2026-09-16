import { z } from 'zod';

/**
 * Environment variables that are safe to read in the browser.
 *
 * `NEXT_PUBLIC_*` values are inlined into the client bundle at build time, so
 * nothing secret may ever live here. Server-only values belong in
 * `src/lib/env.ts`, which is marked `server-only` and cannot be imported from a
 * Client Component.
 *
 * Next.js only inlines `process.env.NEXT_PUBLIC_X` when it is written as a full
 * static property access, which is why each value is spelled out below instead
 * of being read from a loop.
 */
const publicEnvSchema = z.object({
  /** Canonical origin, used for absolute URLs, OpenGraph tags and sitemap.xml. */
  NEXT_PUBLIC_SITE_URL: z
    .url({
      protocol: /^https?$/,
      error: 'Must be an absolute http(s) URL, e.g. https://example.com',
    })
    .default('http://localhost:3000'),

  /** Cloudflare Turnstile public site key. Added in Stage 8. */
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1).optional(),
});

const parsed = publicEnvSchema.safeParse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
});

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  throw new Error(`Invalid public environment variables:\n${details}`);
}

export const publicEnv = parsed.data;

/** Absolute URL helper so no component has to concatenate the origin by hand. */
export function absoluteUrl(path: string): string {
  return new URL(path, publicEnv.NEXT_PUBLIC_SITE_URL).toString();
}
