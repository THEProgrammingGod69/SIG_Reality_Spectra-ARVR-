/**
 * The HTTP security headers every response carries (Stage 9, D-033), applied
 * by `headers()` in next.config.ts. A pure function of a few plain values, so
 * it is unit-tested exactly as it runs; it cannot read `src/lib/env.ts`
 * (server-only), so next.config.ts passes the values in.
 */

/** Third-party origins the site is allowed to talk to, and why. */
export const THIRD_PARTY = {
  /** Cloudflare Turnstile: the /contact spam check (script + its iframe). */
  turnstile: 'https://challenges.cloudflare.com',
  /** Cloudflare Web Analytics: the beacon script, and where it reports. */
  analyticsScript: 'https://static.cloudflareinsights.com',
  analyticsReport: 'https://cloudflareinsights.com',
  /** Google Maps, for the optional map embed on /contact (contact.json). */
  maps: 'https://www.google.com',
  /** Public R2 buckets (r2.dev) and R2's upload endpoint (presigned PUTs). */
  r2Public: 'https://*.r2.dev',
  r2Upload: 'https://*.r2.cloudflarestorage.com',
  /** Netlify's review drawer on deploy previews: its loader script and its frame. */
  netlifyDrawerScript: 'https://netlify-cdp-loader.netlify.app',
  netlifyDrawerApp: 'https://app.netlify.com',
} as const;

export type SecurityOptions = {
  /** `next dev`: React needs eval for its error overlay, HMR a websocket. */
  development: boolean;
  /** The site is served over https: add HSTS and upgrade stray http requests. */
  https: boolean;
  /** R2_PUBLIC_BASE_URL's origin (a custom media domain), when set. */
  mediaOrigin: string | null;
  /** The account's R2 upload endpoint, when R2_ACCOUNT_ID is set. */
  uploadOrigin: string | null;
  /**
   * A Netlify deploy preview or branch deploy, where Netlify injects its review
   * drawer; blocked, it shows as an empty grey frame. Never production.
   */
  netlifyPreview?: boolean;
};

/**
 * Content-Security-Policy. Scripts may come only from the site and the two
 * Cloudflare services. `'unsafe-inline'` stays for scripts and styles: the
 * pages are prerendered (Cache Components), and a per-request nonce would make
 * every page dynamic; Next.js's own inline bootstrap needs one or the other.
 * Everything that matters most is still locked: no plugins, no framing, no
 * foreign base URL or form target, and connections only where listed.
 */
export function contentSecurityPolicy({
  development,
  https,
  mediaOrigin,
  uploadOrigin,
  netlifyPreview = false,
}: SecurityOptions): string {
  const directives: Record<string, (string | null | false)[]> = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'",
      development && "'unsafe-eval'",
      THIRD_PARTY.turnstile,
      THIRD_PARTY.analyticsScript,
      netlifyPreview && THIRD_PARTY.netlifyDrawerScript,
    ],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:', THIRD_PARTY.r2Public, mediaOrigin],
    'font-src': ["'self'", 'data:'],
    'connect-src': [
      "'self'",
      uploadOrigin ?? THIRD_PARTY.r2Upload,
      THIRD_PARTY.analyticsReport,
      development && 'ws:',
      netlifyPreview && THIRD_PARTY.netlifyDrawerApp,
    ],
    'frame-src': [
      THIRD_PARTY.turnstile,
      THIRD_PARTY.maps,
      netlifyPreview && THIRD_PARTY.netlifyDrawerApp,
    ],
    'worker-src': ["'self'", 'blob:'],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    ...(https ? { 'upgrade-insecure-requests': [] } : {}),
  };
  return Object.entries(directives)
    .map(([name, sources]) => [name, ...sources.filter(Boolean)].join(' '))
    .join('; ');
}

/** Every header, for `headers()` in next.config.ts. */
export function securityHeaders(options: SecurityOptions): { key: string; value: string }[] {
  return [
    { key: 'Content-Security-Policy', value: contentSecurityPolicy(options) },
    // Two years, every subdomain — only meaningful (and only sent) over https.
    ...(options.https
      ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' }]
      : []),
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    // The CSP's frame-ancestors, for browsers that only know the old header.
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    {
      key: 'Permissions-Policy',
      // Nothing on the site needs these. WebXR stays possible for the club's
      // own pages (an XR club may demo in the browser), never for embeds.
      value:
        'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=(), xr-spatial-tracking=(self)',
    },
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  ];
}

/** Admin pages and the API: never indexed, whatever the response is (rule 7). */
export const NOINDEX_HEADERS = [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }];

/**
 * Uploaded files served by the site itself (`/api/local-media`: Netlify Blobs,
 * local data mode). Replaces the page CSP: a file is never a document that may
 * run anything, even if a wrong type ever slipped past the upload checks.
 */
export const MEDIA_FILE_HEADERS = [
  { key: 'Content-Security-Policy', value: "default-src 'none'; sandbox" },
];
