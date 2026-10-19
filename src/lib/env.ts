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
    /**
     * Where data lives.
     * - `netlify-blobs`: records and files in the Netlify site's own Blobs
     *   storage; no other account needed.
     * - `vercel-blob`: the same on Vercel, in a private Vercel Blob store
     *   connected to the project (its BLOB_READ_WRITE_TOKEN), D-040.
     * - `upstash`: records in Upstash Redis, files in Cloudflare R2.
     * - `local`: both in the gitignored `.data/` folder, for working before
     *   the accounts exist (D-031); refused on Netlify by the guard below.
     *
     * Left unset, a deploy without Upstash variables uses its host's own
     * store (`netlify-blobs` or `vercel-blob`), and everything else `upstash`
     * (see `defaultBackend`).
     */
    DATA_BACKEND: z.enum(['netlify-blobs', 'vercel-blob', 'upstash', 'local']).optional(),
    /** Vercel Blob's read-write token; Vercel sets it when a store is connected. */
    BLOB_READ_WRITE_TOKEN: z.string().min(1).optional(),
    /** Upstash REST endpoint and token, from the database page on upstash.com. */
    UPSTASH_REDIS_REST_URL: z.url({ protocol: /^https$/ }).optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
    /**
     * Which copy of the club's data this deployment reads and writes. It prefixes
     * every Redis key (`sig:{namespace}:…`) and every R2 object (`{namespace}/…`),
     * so production, deploy previews and tests can share one database and one
     * bucket without ever touching each other's records. Production is `prod`;
     * see the Netlify guard below. Left unset, it follows the deploy context:
     * `prod` for Netlify production, `preview` for any other Netlify deploy,
     * `dev` everywhere else (D-036).
     */
    DATA_NAMESPACE: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lowercase words joined by hyphens, e.g. prod')
      .max(40)
      .optional(),
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
     * Netlify Blobs from outside Netlify, for the command-line tools only
     * (`pnpm seed`, `pnpm data`): the site's id (Site configuration → Site
     * details) and a personal access token (User settings → Applications).
     * Never set them on the Netlify site itself, which reaches its Blobs
     * without them. The token belongs to one person: revoke it at handover.
     */
    NETLIFY_SITE_ID: z
      .guid({ error: 'The site id from Site configuration → Site details' })
      .optional(),
    NETLIFY_AUTH_TOKEN: z
      .string()
      .regex(/^\S{16,}$/, 'A Netlify personal access token')
      .optional(),

    /**
     * Set by Netlify on every build and function: `production`,
     * `deploy-preview`, `branch-deploy` or `dev`. Read only by the guard below.
     */
    CONTEXT: z.string().optional(),
    /**
     * Set by Vercel on every build and function: `production`, `preview` or
     * `development`. Mapped onto Netlify's contexts (`hostContext`).
     */
    VERCEL_ENV: z.enum(['production', 'preview', 'development']).optional(),

    // ---- Stage 6: admin authentication --------------------------------------
    /** Auth.js session signing secret. Generate with `openssl rand -base64 32`. */
    AUTH_SECRET: z.string().min(32).optional(),
    AUTH_GOOGLE_ID: z.string().min(1).optional(),
    AUTH_GOOGLE_SECRET: z.string().min(1).optional(),
    /** Comma-separated allowlist. These accounts, and only these, can reach /admin. */
    ADMIN_EMAILS: commaSeparatedEmails.optional(),
    /**
     * The shared password for the email + password sign-in: an allowlisted
     * email plus this password lets an admin in. Never committed; set it in
     * Netlify. Any length is accepted so a deploy never fails on it, but the
     * dashboard's Setup card warns while it is short or well known. Changing it
     * signs every password session out.
     */
    ADMIN_PASSWORD: z.string().min(1).max(200).optional(),
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
    // production must never quietly run on a test copy. Netlify and Vercel say
    // which deploy this is, so a wrongly scoped variable fails the deploy
    // instead of mixing the two.
    const context = hostContext(value);
    if (context === undefined) return;
    if (value.AUTH_DEV_SIGN_IN === 'true') {
      ctx.addIssue({
        code: 'custom',
        path: ['AUTH_DEV_SIGN_IN'],
        message: 'The development sign-in is never allowed on a deployed site',
      });
    }
    if (value.DATA_BACKEND === 'local') {
      ctx.addIssue({
        code: 'custom',
        path: ['DATA_BACKEND'],
        message:
          'Local data lives on one computer; a deployed site must use its host\'s blob store or "upstash"',
      });
    }
    // An unset namespace is derived from CONTEXT below, so only an explicit
    // value can be wrong.
    if (value.DATA_NAMESPACE === undefined) return;
    const isLive = context === 'production';
    if (isLive !== (value.DATA_NAMESPACE === 'prod')) {
      ctx.addIssue({
        code: 'custom',
        path: ['DATA_NAMESPACE'],
        message: isLive
          ? 'Production deploys must use DATA_NAMESPACE="prod"'
          : `Only production may use DATA_NAMESPACE="prod" (this is a ${context} deploy)`,
      });
    }
  })
  .transform(({ DATA_NAMESPACE, DATA_BACKEND, ...value }) => ({
    ...value,
    DATA_BACKEND: DATA_BACKEND ?? defaultBackend(value),
    DATA_NAMESPACE: DATA_NAMESPACE ?? defaultNamespace(hostContext(value)),
  }));

/**
 * Which deploy this is, in Netlify's words: Netlify's CONTEXT, or Vercel's
 * VERCEL_ENV mapped onto it (`preview` → `deploy-preview`). Undefined on a
 * developer's computer.
 */
function hostContext({
  CONTEXT,
  VERCEL_ENV,
}: {
  CONTEXT?: string;
  VERCEL_ENV?: string;
}): string | undefined {
  if (CONTEXT !== undefined) return CONTEXT;
  if (VERCEL_ENV === 'production') return 'production';
  if (VERCEL_ENV === 'preview') return 'deploy-preview';
  return undefined;
}

/**
 * The backend when DATA_BACKEND is not set: once Upstash is configured,
 * Upstash; until then the host's own blob store (Netlify Blobs on Netlify,
 * Vercel Blob on Vercel); on a developer's computer Upstash, as before (they
 * set `local`).
 */
function defaultBackend({
  CONTEXT,
  VERCEL_ENV,
  UPSTASH_REDIS_REST_URL,
}: {
  CONTEXT?: string;
  VERCEL_ENV?: string;
  UPSTASH_REDIS_REST_URL?: string;
}): 'netlify-blobs' | 'vercel-blob' | 'upstash' {
  if (UPSTASH_REDIS_REST_URL !== undefined) return 'upstash';
  if (CONTEXT !== undefined) return 'netlify-blobs';
  if (VERCEL_ENV !== undefined && VERCEL_ENV !== 'development') return 'vercel-blob';
  return 'upstash';
}

/** The namespace for a deploy that does not set one: see DATA_NAMESPACE above. */
function defaultNamespace(context: string | undefined): string {
  if (context === undefined) return 'dev';
  return context === 'production' ? 'prod' : 'preview';
}

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Escape hatch for environments that build without runtime secrets
 * (Docker image builds, some CI lint jobs). Never set this in production.
 */
const skipValidation =
  process.env.SKIP_ENV_VALIDATION === '1' || process.env.SKIP_ENV_VALIDATION === 'true';

/**
 * A value as people paste it into a host's settings: surrounding spaces and
 * one pair of matching quotes (copied from a `.env` file) are not part of it.
 * Blank means "not set".
 */
export function cleanEnvValue(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  let clean = value.trim();
  const first = clean[0];
  if (clean.length >= 2 && (first === '"' || first === "'") && clean.endsWith(first)) {
    clean = clean.slice(1, -1).trim();
  }
  return clean === '' ? undefined : clean;
}

/**
 * The environment this deployment runs with, made to work rather than to fail
 * (D-041). A mistake in the host's settings must never take the site down or
 * break the admin panel, so instead of refusing to start:
 *
 * - values are cleaned (`cleanEnvValue`);
 * - ADMIN_EMAILS keeps its valid addresses and drops the rest;
 * - the deploy guards correct instead of failing: a deployed site ignores
 *   `DATA_BACKEND=local` and `AUTH_DEV_SIGN_IN=true`, and a namespace that
 *   does not match the deploy (production `prod`, previews never `prod`)
 *   falls back to the deploy's own;
 * - any other invalid variable is ignored, as if it were not set.
 *
 * Every correction is reported in `warnings`: in the logs, on the admin
 * dashboard's Setup card and, for sign-in settings, on the sign-in page.
 * `serverEnvSchema` itself stays strict, so the rules stay tested as rules.
 */
export function resolveEnv(raw: Record<string, string | undefined>): {
  env: ServerEnv;
  warnings: string[];
} {
  const warnings: string[] = [];
  const values: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    const clean = cleanEnvValue(value);
    if (clean !== undefined) values[key] = clean;
  }

  if (values.ADMIN_EMAILS !== undefined) {
    const entries = values.ADMIN_EMAILS.split(',')
      .map((entry) => cleanEnvValue(entry)?.toLowerCase())
      .filter((entry): entry is string => entry !== undefined);
    const valid = entries.filter((entry) => z.email().safeParse(entry).success);
    if (valid.length < entries.length) {
      warnings.push(
        `ADMIN_EMAILS: ${entries.length - valid.length} entr${entries.length - valid.length === 1 ? 'y is' : 'ies are'} not an email address and ${entries.length - valid.length === 1 ? 'was' : 'were'} ignored.`,
      );
    }
    if (valid.length > 0) values.ADMIN_EMAILS = valid.join(',');
    else delete values.ADMIN_EMAILS;
  }

  const context = hostContext(values);
  if (context !== undefined) {
    if (values.AUTH_DEV_SIGN_IN === 'true') {
      delete values.AUTH_DEV_SIGN_IN;
      warnings.push('AUTH_DEV_SIGN_IN is ignored on a deployed site.');
    }
    if (values.DATA_BACKEND === 'local') {
      delete values.DATA_BACKEND;
      warnings.push(
        "DATA_BACKEND=local is ignored on a deployed site: the host's own store is used.",
      );
    }
    const namespace = values.DATA_NAMESPACE;
    if (namespace !== undefined && (context === 'production') !== (namespace === 'prod')) {
      delete values.DATA_NAMESPACE;
      warnings.push(
        `DATA_NAMESPACE="${namespace}" does not match this ${context} deploy and was ignored.`,
      );
    }
  }

  // Ignore what is still invalid, one variable at a time, until it parses.
  for (;;) {
    const parsed = serverEnvSchema.safeParse(values);
    if (parsed.success) return { env: parsed.data, warnings };
    const invalid = new Map<string, string>();
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string' && key in values && !invalid.has(key)) {
        invalid.set(key, issue.message);
      }
    }
    if (invalid.size === 0) {
      const details = parsed.error.issues.map((issue) => `  - ${issue.message}`).join('\n');
      throw new Error(`Invalid server environment variables:\n${details}`);
    }
    for (const [key, message] of invalid) {
      delete values[key];
      warnings.push(`${key} was ignored: ${message}.`);
    }
  }
}

/**
 * The environment as the running site sees it, plus the deploy context the
 * build baked in (`BUILD_CONTEXT`, next.config.ts): Netlify sets CONTEXT for
 * the build but not for the functions that serve the site, which would
 * otherwise take themselves for a developer's computer (D-041).
 */
export function withBuildContext(
  raw: Record<string, string | undefined>,
  builtFor: string | undefined,
): Record<string, string | undefined> {
  return raw.CONTEXT === undefined && builtFor ? { ...raw, CONTEXT: builtFor } : raw;
}

function parseEnv(): { env: ServerEnv; warnings: readonly string[] } {
  if (skipValidation) return { env: serverEnvSchema.parse({}), warnings: [] };
  // `process.env.BUILD_CONTEXT` is replaced with the build's value (next.config.ts env).
  const resolved = resolveEnv(withBuildContext(process.env, process.env.BUILD_CONTEXT));
  for (const warning of resolved.warnings) console.warn(`[env] ${warning}`);
  return resolved;
}

const resolved = parseEnv();

/** What `resolveEnv` corrected or ignored in this deployment's settings. */
export const envWarnings: readonly string[] = resolved.warnings;

export const env: ServerEnv = resolved.env;

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
