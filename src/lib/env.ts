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
export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // ---- Stage 1: foundation -------------------------------------------------
  /** Canonical origin. Mirrored in `env.public.ts` for browser use. */
  NEXT_PUBLIC_SITE_URL: z
    .url({
      protocol: /^https?$/,
      error: 'Must be an absolute http(s) URL, e.g. https://example.com',
    })
    .default('http://localhost:3000'),

  // ---- Stage 5: data layer (Upstash Redis + Vercel Blob) -------------------
  /** Upstash REST endpoint. Provided by the Vercel Marketplace integration. */
  UPSTASH_REDIS_REST_URL: z.url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  /**
   * Namespace for every Redis key. Production and Preview MUST differ so
   * preview testing can never mutate live club data.
   */
  REDIS_KEY_PREFIX: z.string().min(1).default('sig:dev'),
  /** Vercel Blob read/write token, for event poster uploads. */
  BLOB_READ_WRITE_TOKEN: z.string().min(1).optional(),

  // ---- Stage 6: admin authentication --------------------------------------
  /** Auth.js session signing secret. Generate with `openssl rand -base64 32`. */
  AUTH_SECRET: z.string().min(32).optional(),
  AUTH_GOOGLE_ID: z.string().min(1).optional(),
  AUTH_GOOGLE_SECRET: z.string().min(1).optional(),
  /** Comma-separated allowlist. These accounts, and only these, can reach /admin. */
  ADMIN_EMAILS: commaSeparatedEmails.optional(),

  // ---- Stage 8: enquiries, email and spam protection ----------------------
  RESEND_API_KEY: z.string().min(1).optional(),
  /** Where sponsor enquiry alerts are delivered (the club inbox). */
  ENQUIRY_NOTIFICATION_EMAIL: z.email().optional(),
  /** Verified Resend sender. Must be on a verified domain in production. */
  ENQUIRY_FROM_EMAIL: z.email().optional(),
  TURNSTILE_SECRET_KEY: z.string().min(1).optional(),
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
    return serverEnvSchema.partial().parse({}) as ServerEnv;
  }

  const parsed = serverEnvSchema.safeParse(process.env);

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
 *   const token = requireEnv('BLOB_READ_WRITE_TOKEN', 'event poster uploads');
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
