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
    id: 'google',
    label: 'Google sign-in',
    purpose: 'How admins sign in on the live site (docs/SETUP_AUTH.md).',
    variables: ['AUTH_GOOGLE_ID', 'AUTH_GOOGLE_SECRET'],
  },
  {
    id: 'admins',
    label: 'Admin allowlist',
    purpose: 'The Google accounts allowed into this panel.',
    variables: ['ADMIN_EMAILS'],
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
    purpose: 'Protects the sponsorship form on /contact (Stage 8).',
    variables: ['NEXT_PUBLIC_TURNSTILE_SITE_KEY', 'TURNSTILE_SECRET_KEY'],
  },
  {
    id: 'cron',
    label: 'Nightly job secret',
    purpose: 'Authorises the nightly backup and file clean-up (Stage 10).',
    variables: ['CRON_SECRET'],
  },
] as const satisfies readonly {
  id: string;
  label: string;
  purpose: string;
  variables: readonly (keyof ServerEnv | `NEXT_PUBLIC_${string}`)[];
}[];

export type IntegrationId = (typeof INTEGRATIONS)[number]['id'];

/** Server variables come validated from `env`; NEXT_PUBLIC_ ones from the process. */
function isSet(name: string): boolean {
  const value = (env as Readonly<Record<string, unknown>>)[name] ?? process.env[name];
  return value !== undefined && value !== '';
}

export const integrations = INTEGRATIONS.map((integration) => ({
  ...integration,
  configured: integration.variables.every(isSet),
}));

export function isConfigured(id: IntegrationId): boolean {
  return integrations.some((integration) => integration.id === id && integration.configured);
}
