import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

/**
 * The admin access rules, as pure functions of the environment, so they are
 * unit-tested exactly as they run (D-030). No secret is read here: callers
 * pass in whatever is compared.
 */

/** Sessions last one working day; after that the admin signs in again. */
export const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

export const LOGIN_PATH = '/admin/login';

/** The development sign-in's Auth.js provider id (D-030). */
export const DEV_PROVIDER = 'dev';
/** The email + password sign-in's Auth.js provider id. */
export const PASSWORD_PROVIDER = 'password';

/**
 * Of the cookies Auth.js sets while the proxy reads a session, the ones the
 * proxy passes on: removals only. Auth.js otherwise re-issues the session
 * cookie on every request it reads, and a request still in flight when an
 * admin signs out — a link prefetch — would put the session back. Sessions
 * therefore last a fixed `SESSION_MAX_AGE_SECONDS` from sign-in (D-032).
 */
export function cookieRemovalsOnly(setCookies: readonly string[]): string[] {
  return setCookies.filter((cookie) =>
    /;\s*max-age=0\s*(;|$)|;\s*expires=thu, 01 jan 1970/i.test(cookie),
  );
}
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
  VERCEL_ENV?: string | undefined;
  AUTH_SECRET?: string | undefined;
  AUTH_GOOGLE_ID?: string | undefined;
  AUTH_GOOGLE_SECRET?: string | undefined;
  AUTH_DEV_SIGN_IN?: 'true' | 'false' | undefined;
  ADMIN_EMAILS?: readonly string[] | undefined;
  ADMIN_PASSWORD?: string | undefined;
};

/**
 * The development sign-in: one click as an allowlisted email, no password, for
 * working on the panel before Google sign-in is configured. On under `next dev`
 * or with AUTH_DEV_SIGN_IN=true, and never where Netlify sets CONTEXT or
 * Vercel a deployed VERCEL_ENV — a deployed site cannot have it.
 */
export function isDevSignInEnabled(env: AuthEnv): boolean {
  if (env.CONTEXT !== undefined) return false;
  if (env.VERCEL_ENV !== undefined && env.VERCEL_ENV !== 'development') return false;
  return env.NODE_ENV === 'development' || env.AUTH_DEV_SIGN_IN === 'true';
}

/** What admin sign-in can do in this environment. */
export function authSetup(env: AuthEnv) {
  const secret = Boolean(env.AUTH_SECRET);
  const admins = env.ADMIN_EMAILS ?? [];
  const google = secret && Boolean(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET);
  const devSignIn = secret && admins.length > 0 && isDevSignInEnabled(env);
  const password = secret && admins.length > 0 && Boolean(env.ADMIN_PASSWORD);
  return {
    /** Sessions can be signed and checked at all. */
    secret,
    admins,
    google,
    devSignIn,
    /** An allowlisted email plus ADMIN_PASSWORD signs in. */
    password,
    /** The password sign-in is on, with a password that is easy to guess. */
    weakPassword: password && isWeakPassword(env.ADMIN_PASSWORD ?? ''),
    /** At least one way in exists. */
    ready: admins.length > 0 && (google || devSignIn || password),
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

/**
 * Whether an `Authorization` header carries exactly `Bearer <secret>`: how the
 * nightly job proves it is the scheduler (D-034). Compared in constant time,
 * so response timing reveals nothing about the secret.
 */
export function isBearer(header: string | null, secret: string): boolean {
  const expected = `Bearer ${secret}`;
  if (header === null || header.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= header.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return difference === 0;
}

/* -------------------------------------------------------------------------- */
/* The email + password sign-in                                               */
/* -------------------------------------------------------------------------- */

/**
 * Whether a typed password is the admin password, in constant time. Both
 * sides are hashed first, so the comparison always runs over 32 bytes and its
 * timing reveals neither the password nor its length.
 */
export function passwordMatches(given: string, expected: string): boolean {
  const digest = (value: string) => createHash('sha256').update(value, 'utf8').digest();
  return timingSafeEqual(digest(given), digest(expected));
}

/**
 * Which admin password a session was signed in with, without keeping the
 * password: an HMAC under the session secret, stored in the session token.
 * A session whose fingerprint no longer matches is refused, so changing
 * ADMIN_PASSWORD signs every password session out at once.
 */
export function passwordFingerprint(secret: string, password: string): string {
  return createHmac('sha256', secret)
    .update(`admin-password\n${password}`, 'utf8')
    .digest('hex')
    .slice(0, 32);
}

/** Shorter than this is weak, whatever it is made of. */
export const MIN_STRONG_PASSWORD_LENGTH = 12;

/**
 * The first guesses of anyone trying a password, compared after lowercasing
 * and dropping symbols and trailing digits, so "Admin@123" counts as "admin"
 * and "RealitySpectra2026!" as the club's name.
 */
const COMMON_PASSWORDS = new Set([
  'admin',
  'administrator',
  'password',
  'passw0rd',
  'qwerty',
  'qwertyuiop',
  'letmein',
  'welcome',
  'changeme',
  'iloveyou',
  'secret',
  'vitpune',
  'spectra',
  'realityspectra',
  'sigrealityspectra',
]);

/**
 * Whether ADMIN_PASSWORD is easy to guess: shorter than
 * `MIN_STRONG_PASSWORD_LENGTH`, one repeated character, only digits, or a
 * well-known password (or the club's name) with a number tacked on. The Setup
 * card warns about it; sign-in still accepts it, so a weak password never
 * locks the club out of its own panel.
 */
export function isWeakPassword(password: string): boolean {
  if (password.length < MIN_STRONG_PASSWORD_LENGTH) return true;
  if (new Set(password).size === 1 || /^\d+$/.test(password)) return true;
  const core = password
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/\d+$/, '');
  return COMMON_PASSWORDS.has(core);
}

/**
 * The client's address, for the sign-in attempt limit. Netlify sets
 * `x-nf-client-connection-ip` itself, so a visitor cannot choose it; elsewhere
 * the first `x-forwarded-for` entry is the best there is.
 */
export function clientAddress(headers: Headers): string {
  const netlify = headers.get('x-nf-client-connection-ip')?.trim();
  if (netlify) return netlify;
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || 'unknown';
}

/** What a session says about its admin: the fields `adminFromSession` reads. */
export type SessionClaims = {
  email?: string | null | undefined;
  provider?: string | undefined;
  passwordFingerprint?: string | undefined;
};

/** What a session is judged against: the environment as it is now. */
export type SessionRules = {
  admins: readonly string[];
  devSignIn: boolean;
  /** The current admin password's fingerprint; null while the password sign-in is off. */
  passwordFingerprint: string | null;
};

/**
 * The admin a session belongs to, or null when the rules as they are *now*
 * no longer let it in: the email has left the allowlist, the development
 * sign-in is off, or the password sign-in is off or its password has changed.
 */
export function admittedEmail(claims: SessionClaims | null, rules: SessionRules): string | null {
  const email = claims?.email?.toLowerCase();
  if (!claims || !email || !isAllowedAdmin(email, rules.admins)) return null;
  if (claims.provider === DEV_PROVIDER && !rules.devSignIn) return null;
  if (claims.provider === PASSWORD_PROVIDER) {
    if (rules.passwordFingerprint === null) return null;
    if (claims.passwordFingerprint !== rules.passwordFingerprint) return null;
  }
  return email;
}
