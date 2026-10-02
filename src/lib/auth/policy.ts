/**
 * The admin access rules, as pure functions of the environment, so they are
 * unit-tested exactly as they run (D-030). No secret is read here.
 */

/** Sessions last one working day; after that the admin signs in again. */
export const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

export const LOGIN_PATH = '/admin/login';
const DASHBOARD_PATH = '/admin';

/** Whether an email is on the allowlist. Comparison ignores case and spaces. */
export function isAllowedAdmin(
  email: string | null | undefined,
  allowlist: readonly string[] | undefined,
): boolean {
  if (!email || !allowlist) return false;
  return allowlist.includes(email.trim().toLowerCase());
}

type AuthEnv = {
  NODE_ENV: 'development' | 'test' | 'production';
  CONTEXT?: string | undefined;
  AUTH_SECRET?: string | undefined;
  AUTH_GOOGLE_ID?: string | undefined;
  AUTH_GOOGLE_SECRET?: string | undefined;
  AUTH_DEV_SIGN_IN?: 'true' | 'false' | undefined;
  ADMIN_EMAILS?: readonly string[] | undefined;
};

/**
 * The development sign-in: one click as an allowlisted email, no password, for
 * working on the panel before Google sign-in is configured. On under `next dev`
 * or with AUTH_DEV_SIGN_IN=true, and never where Netlify sets CONTEXT — a
 * deployed site cannot have it.
 */
export function isDevSignInEnabled(env: AuthEnv): boolean {
  if (env.CONTEXT !== undefined) return false;
  return env.NODE_ENV === 'development' || env.AUTH_DEV_SIGN_IN === 'true';
}

/** What admin sign-in can do in this environment. */
export function authSetup(env: AuthEnv) {
  const secret = Boolean(env.AUTH_SECRET);
  const admins = env.ADMIN_EMAILS ?? [];
  const google = secret && Boolean(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET);
  const devSignIn = secret && admins.length > 0 && isDevSignInEnabled(env);
  return {
    /** Sessions can be signed and checked at all. */
    secret,
    admins,
    google,
    devSignIn,
    /** At least one way in exists. */
    ready: admins.length > 0 && (google || devSignIn),
  };
}

export type AuthSetup = ReturnType<typeof authSetup>;

/**
 * Where to go after signing in. Only admin pages are allowed, so a crafted
 * `callbackUrl` cannot send an admin to another site (an open redirect).
 */
export function safeCallbackPath(value: string | string[] | null | undefined): string {
  const path = Array.isArray(value) ? value[0] : value;
  if (!path || !path.startsWith('/admin') || path.startsWith(LOGIN_PATH)) return DASHBOARD_PATH;
  const next = path.slice('/admin'.length);
  if (next !== '' && !next.startsWith('/') && !next.startsWith('?')) return DASHBOARD_PATH;
  if (path.includes('//') || path.includes('\\')) return DASHBOARD_PATH;
  return path;
}
