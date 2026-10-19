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

  /** Cloudflare Turnstile public site key (Stage 8, D-032). */
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1).optional(),

  /**
   * Cloudflare Web Analytics site token (Stage 9, D-033): public by design —
   * it is in the page's beacon tag. Without it, no analytics script loads.
   */
  NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN: z
    .string()
    .regex(/^[a-f0-9]{32}$/, 'The 32-character token from Cloudflare → Web Analytics')
    .optional(),
});

/** Trimmed, one pair of pasted quotes removed, blank = unset (as `cleanEnvValue` in env.ts). */
function clean(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  let result = value.trim();
  const first = result[0];
  if (result.length >= 2 && (first === '"' || first === "'") && result.endsWith(first)) {
    result = result.slice(1, -1).trim();
  }
  return result === '' ? undefined : result;
}

/**
 * The site's own address when NEXT_PUBLIC_SITE_URL is not set: what the host
 * says it is. Netlify sets URL (production) and DEPLOY_PRIME_URL (previews);
 * Vercel sets VERCEL_PROJECT_PRODUCTION_URL and VERCEL_URL (host names only).
 * Only server code reads this module, so these build and runtime variables
 * are visible here (D-041).
 */
export function hostSiteUrl(source: Record<string, string | undefined>): string | undefined {
  if (source.CONTEXT !== undefined) {
    return source.CONTEXT === 'production'
      ? clean(source.URL)
      : (clean(source.DEPLOY_PRIME_URL) ?? clean(source.URL));
  }
  const vercelHost =
    source.VERCEL_ENV === 'production'
      ? (clean(source.VERCEL_PROJECT_PRODUCTION_URL) ?? clean(source.VERCEL_URL))
      : clean(source.VERCEL_URL);
  return vercelHost ? `https://${vercelHost}` : undefined;
}

/**
 * Each value is checked on its own, and a malformed one is ignored with a
 * warning rather than stopping the site (D-041): a typo in an optional key
 * must not take the pages down.
 */
function parsePublicEnv() {
  const raw = {
    NEXT_PUBLIC_SITE_URL: clean(process.env.NEXT_PUBLIC_SITE_URL) ?? hostSiteUrl(process.env),
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: clean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY),
    NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN: clean(process.env.NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN),
  };
  for (;;) {
    const parsed = publicEnvSchema.safeParse(raw);
    if (parsed.success) return parsed.data;
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof typeof raw;
      if (raw[key] === undefined) throw new Error(`Invalid public environment: ${issue.message}`);
      console.warn(`[env] ${String(key)} was ignored: ${issue.message}.`);
      raw[key] = undefined;
    }
  }
}

export const publicEnv = parsePublicEnv();

/** Absolute URL helper so no component has to concatenate the origin by hand. */
export function absoluteUrl(path: string): string {
  return new URL(path, publicEnv.NEXT_PUBLIC_SITE_URL).toString();
}
