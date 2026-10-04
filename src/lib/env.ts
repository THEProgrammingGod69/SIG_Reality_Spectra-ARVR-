import 'server-only';

import { z } from 'zod';

/**
 * Server-side environment contract, validated once at module load.
 *
 * Why every variable below is optional today
 * ------------------------------------------
 * The project is built in stages and each stage turns on a new integration.
 * Marking a Stage 8 variable as required in Stage 1 would mean `pnpm build`
 * could not pass until every third-party account exists, which defeats the
 * point of staged delivery.
 *
 * So the schema validates the SHAPE of every variable that will ever be needed
 * (a malformed URL or a too-short secret fails immediately), while presence is
 * enforced at the moment a feature actually reads it, via `requireEnv()`.
 * Each variable is annotated with the stage that makes it mandatory.
 *
 * This file is `server-only`: importing it from a Client Component is a build
 * error, so a secret cannot reach the browser by accident.
 */

const commaSeparatedEmails = z
  .string()
  .transform((value) =>
    value
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter((entry) => entry.length > 0),
  )
  .pipe(z.array(z.email()).min(1));

/**
 * Exported so unit tests can assert the parsing rules (for example that
 * ADMIN_EMAILS is split, trimmed and lowercased) without mutating process.env.
 */
export const serverEnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

    // ---- Stage 1: foundation -------------------------------------------------
    /** Canonical origin. Mirrored in `env.public.ts` for browser use. */
    NEXT_PUBLIC_SITE_URL: z
      .url({
        protocol: /^https?$/,
        error: 'Must be an absolute http(s) URL, e.g. https://example.com',
      })
      .default('http://localhost:3000'),

    // ---- Stage 5: data layer (Upstash Redis + Cloudflare R2) ----------------
    /** Upstash REST endpoint and token, from the database page on upstash.com. */
    /**
     * Where data lives. `upstash` (records) + R2 (files) is the real thing.
     * `local` keeps both in the gitignored `.data/` folder, for working before
     * the accounts exist (D-031); refused on Netlify by the guard below.
     */
    DATA_BACKEND: z.enum(['upstash', 'local']).default('upstash'),
    UPSTASH_REDIS_REST_URL: z.url({ protocol: /^https$/ }).optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
    /**
     * Which copy of the club's data this deployment reads and writes. It prefixes
     * every Redis key (`sig:{namespace}:…`) and every R2 object (`{namespace}/…`),
     * so production, deploy previews and tests can share one database and one
     * bucket without ever touching each other's records. Production is `prod`;
     * see the Netlify guard below.
     */
    DATA_NAMESPACE: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lowercase words joined by hyphens, e.g. prod')
      .max(40)
      .default('dev'),
    /**
     * Cloudflare R2 (S3-compatible object storage): event posters and photos,
     * gallery and team photos, the recruitment PDF and nightly backups. The API
     * token needs "Object Read & Write" on this one bucket only.
     */
    R2_ACCOUNT_ID: z
      .string()
      .regex(/^[a-f0-9]{32}$/, 'The 32-character account id from the R2 overview page')
      .optional(),
    R2_ACCESS_KEY_ID: z.string().min(1).optional(),
    R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    R2_BUCKET: z
      .string()
      .regex(/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/, 'An R2 bucket name')
      .optional(),
    /**
     * The bucket's public origin: its r2.dev URL or a custom domain, with no
     * trailing slash. Stored image and PDF URLs start with it.
     */
    R2_PUBLIC_BASE_URL: z
      .url({ protocol: /^https$/, error: 'Must be an https:// origin' })
      .refine((url) => new URL(url).pathname === '/' && !url.endsWith('/'), {
        message: 'An origin only, with no path or trailing slash',
      })
      .optional(),

    /**
     * Set by Netlify on every build and function: `production`,
     * `deploy-preview`, `branch-deploy` or `dev`. Read only by the guard below.
     */
    CONTEXT: z.string().optional(),

    // ---- Stage 6: admin authentication --------------------------------------
    /** Auth.js session signing secret. Generate with `openssl rand -base64 32`. */
    AUTH_SECRET: z.string().min(32).optional(),
    AUTH_GOOGLE_ID: z.string().min(1).optional(),
    AUTH_GOOGLE_SECRET: z.string().min(1).optional(),
    /** Comma-separated allowlist. These accounts, and only these, can reach /admin. */
    ADMIN_EMAILS: commaSeparatedEmails.optional(),
    /**
     * "true" turns the development sign-in on in a production build (the
     * end-to-end tests' CI run). `next dev` has it on anyway. Refused on Netlify
     * by the guard below, so it can never reach a deployed site (D-030).
     */
    AUTH_DEV_SIGN_IN: z.enum(['true', 'false']).optional(),

    // ---- Stage 8: sponsorship requests and spam protection -------------------
    // Requests are stored and read in /admin/sponsorships. There is deliberately
    // no email integration; see docs/DECISIONS.md (D-008).
    TURNSTILE_SECRET_KEY: z.string().min(1).optional(),

    // ---- Stage 10: the nightly job (D-034) -------------------------------------
    /**
     * Shared secret the Netlify scheduled function sends as a Bearer token. The
     * nightly job (backup of every record + sweep of unused uploads) rejects any
     * request without it.
     */
    CRON_SECRET: z.string().min(16).optional(),
  })
  .superRefine((value, ctx) => {
    // A deploy preview must never be able to write to the live club data, and
    // production must never quietly run on a test copy. Netlify sets CONTEXT, so
    // a wrongly scoped variable fails the deploy instead of mixing the two.
    if (value.CONTEXT === undefined) return;
    if (value.AUTH_DEV_SIGN_IN === 'true') {
      ctx.addIssue({
        code: 'custom',
        path: ['AUTH_DEV_SIGN_IN'],
        message: 'The development sign-in is never allowed on a Netlify deploy',
      });
    }
    if (value.DATA_BACKEND === 'local') {
      ctx.addIssue({
        code: 'custom',
        path: ['DATA_BACKEND'],
        message: 'Local data lives on one computer; a Netlify deploy must use "upstash"',
      });
    }
    const isLive = value.CONTEXT === 'production';
    if (isLive !== (value.DATA_NAMESPACE === 'prod')) {
      ctx.addIssue({
        code: 'custom',
        path: ['DATA_NAMESPACE'],
        message: isLive
          ? 'Production deploys must use DATA_NAMESPACE="prod"'
          : `Only production may use DATA_NAMESPACE="prod" (this is a ${value.CONTEXT} deploy)`,
      });
    }
  });

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Escape hatch for environments that build without runtime secrets
 * (Docker image builds, some CI lint jobs). Never set this in production.
 */
const skipValidation =
  process.env.SKIP_ENV_VALIDATION === '1' || process.env.SKIP_ENV_VALIDATION === 'true';

function parseEnv(): ServerEnv {
  if (skipValidation) {
    return serverEnvSchema.parse({});
  }

  // A variable copied blank from .env.example means "not set yet", not "".
  const setValues = Object.fromEntries(
    Object.entries(process.env).filter(([, value]) => value !== ''),
  );
  const parsed = serverEnvSchema.safeParse(setValues);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(
      `Invalid server environment variables:\n${details}\n\n` +
        'Copy .env.example to .env.local and fill in the values for the stage you are on.',
    );
  }

  return parsed.data;
}

export const env: ServerEnv = parseEnv();

/**
 * Read a variable that a feature genuinely cannot run without.
 *
 * Use this at the point of use inside the repository or an integration module,
 * so a missing key produces a precise, actionable error instead of `undefined`
 * travelling deep into the call stack.
 *
 * @example
 *   const token = requireEnv('R2_BUCKET', 'event photo uploads');
 */
export function requireEnv<K extends keyof ServerEnv>(
  key: K,
  featureName: string,
): NonNullable<ServerEnv[K]> {
  const value = env[key];

  if (value === undefined || value === null || value === '') {
    throw new Error(
      `Missing required environment variable ${String(key)}, needed for ${featureName}. ` +
        'See .env.example for what it should contain.',
    );
  }

  return value as NonNullable<ServerEnv[K]>;
}

export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
