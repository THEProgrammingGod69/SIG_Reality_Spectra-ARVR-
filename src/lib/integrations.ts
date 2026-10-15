import 'server-only';

import { env, type ServerEnv } from '@/lib/env';

/**
 * Every outside service the site uses, and whether this environment has its
 * credentials. The admin dashboard lists them, so a placeholder credential is
 * visible rather than discovered when a feature fails (D-030); features check
 * their own entry before calling a service they cannot reach.
 */
const INTEGRATIONS = [
  {
    id: 'auth-secret',
    label: 'Session signing secret',
    purpose: 'Signs admin sessions. Generate one per environment.',
    variables: ['AUTH_SECRET'],
  },
  {
    id: 'admins',
    label: 'Admin allowlist',
    purpose: 'The emails allowed into this panel, with the password or their Google account.',
    variables: ['ADMIN_EMAILS'],
  },
  {
    id: 'password',
    label: 'Password sign-in',
    purpose: 'Admins sign in with their allowlisted email and this shared password.',
    variables: ['ADMIN_PASSWORD'],
  },
  {
    id: 'google',
    label: 'Google sign-in',
    purpose:
      'Admins sign in with their Google account (docs/SETUP_AUTH.md). Optional while the password sign-in is set.',
    variables: ['AUTH_GOOGLE_ID', 'AUTH_GOOGLE_SECRET'],
    optionalWith: 'password',
  },
  {
    id: 'redis',
    label: 'Data store (Upstash Redis)',
    purpose: 'Events, gallery, team, recruitment and requests (docs/SETUP_STORAGE.md).',
    variables: ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'],
  },
  {
    id: 'r2',
    label: 'File storage (Cloudflare R2)',
    purpose: 'Photos, posters and the roles PDF (docs/SETUP_STORAGE.md).',
    variables: [
      'R2_ACCOUNT_ID',
      'R2_ACCESS_KEY_ID',
      'R2_SECRET_ACCESS_KEY',
      'R2_BUCKET',
      'R2_PUBLIC_BASE_URL',
    ],
  },
  {
    id: 'turnstile',
    label: 'Spam protection (Cloudflare Turnstile)',
    purpose:
      'Protects the sponsorship form on /contact; without it a deploy hides the form (D-032).',
    variables: ['NEXT_PUBLIC_TURNSTILE_SITE_KEY', 'TURNSTILE_SECRET_KEY'],
  },
  {
    id: 'analytics',
    label: 'Visitor analytics (Cloudflare Web Analytics)',
    purpose: 'Cookieless page-view counts for the public site; off without its token (D-033).',
    variables: ['NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN'],
  },
  {
    id: 'cron',
    label: 'Nightly job secret',
    purpose: 'Authorises the nightly backup and file clean-up (D-034, docs/handbook/backups.md).',
    variables: ['CRON_SECRET'],
  },
] as const satisfies readonly {
  id: string;
  label: string;
  purpose: string;
  variables: readonly (keyof ServerEnv | `NEXT_PUBLIC_${string}`)[];
  /** Not needed once this other integration is configured: another way to the same end. */
  optionalWith?: string;
}[];

export type IntegrationId = (typeof INTEGRATIONS)[number]['id'];

/** Server variables come validated from `env`; NEXT_PUBLIC_ ones from the process. */
function isSet(name: string): boolean {
  const value = (env as Readonly<Record<string, unknown>>)[name] ?? process.env[name];
  return value !== undefined && value !== '';
}

const configured = (variables: readonly string[]) => variables.every(isSet);

export const integrations = INTEGRATIONS.map((integration) => ({
  ...integration,
  configured: configured(integration.variables),
  /** Unset, but not missing: what it offers is already covered (Google, with the password set). */
  optional:
    'optionalWith' in integration &&
    INTEGRATIONS.some(
      (other) => other.id === integration.optionalWith && configured(other.variables),
    ),
}));

export function isConfigured(id: IntegrationId): boolean {
  return integrations.some((integration) => integration.id === id && integration.configured);
}
