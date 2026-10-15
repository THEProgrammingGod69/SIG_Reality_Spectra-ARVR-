import 'server-only';

import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';

import { allowSignInAttempt } from '@/lib/data';
import { env } from '@/lib/env';

import {
  authSetup,
  clientAddress,
  DEV_PROVIDER,
  isAllowedAdmin,
  LOGIN_PATH,
  PASSWORD_PROVIDER,
  passwordFingerprint,
  passwordMatches,
  SESSION_MAX_AGE_SECONDS,
} from './policy';

declare module 'next-auth' {
  interface Session {
    /** How this admin signed in: `password`, `google`, or `dev` for the development sign-in. */
    provider?: string;
    /** For a password sign-in: which ADMIN_PASSWORD it used (`passwordFingerprint()`). */
    passwordFingerprint?: string;
  }
}

export { DEV_PROVIDER, PASSWORD_PROVIDER };

/** Auth.js error types that mean "not allowed in", not "something broke". */
const REFUSED = new Set(['AccessDenied', 'CredentialsSignin']);

/** What admin sign-in can do here: which ways in exist, who is allowed. */
export const setup = authSetup(env);

/**
 * The current admin password's fingerprint, which every password session must
 * carry; null while the password sign-in is off.
 */
export const currentPasswordFingerprint =
  setup.password && env.AUTH_SECRET && env.ADMIN_PASSWORD
    ? passwordFingerprint(env.AUTH_SECRET, env.ADMIN_PASSWORD)
    : null;

/**
 * A password sign-in refused because the client or the email has made too
 * many attempts. Auth.js puts the code in the sign-in page's URL
 * (`code=too_many_attempts`) and Server Actions read it off the error.
 */
export class TooManyAttempts extends CredentialsSignin {
  override code = 'too_many_attempts';
}

/**
 * Auth.js (D-030): JWT sessions, no database, no user table. Access control is
 * the ADMIN_EMAILS allowlist, and for the password sign-in one shared
 * ADMIN_PASSWORD, kept only in the environment.
 *
 * Credentials are read when a request needs them, so a missing secret or
 * Google key affects only sign-in — the build and the public site never need
 * them (the proxy and `getAdminSession()` check `setup.secret` first).
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: env.AUTH_SECRET,
  // Netlify serves the site on its own, preview and custom hostnames.
  trustHost: true,
  session: { strategy: 'jwt', maxAge: SESSION_MAX_AGE_SECONDS },
  pages: { signIn: LOGIN_PATH, error: LOGIN_PATH },
  logger: {
    // A refused sign-in is routine, not a server error: one line, no stack.
    error(error) {
      const refused = 'type' in error && REFUSED.has(String(error.type));
      if (!refused) console.error('[auth]', error);
      else if (error instanceof TooManyAttempts)
        console.warn(
          '[auth] Refused a sign-in: too many attempts from that client or for that email.',
        );
      else
        console.warn('[auth] Refused a sign-in: not an allowlisted account, or a wrong password.');
    },
  },
  providers: [
    ...(setup.password
      ? [
          Credentials({
            id: PASSWORD_PROVIDER,
            name: 'Email and password',
            credentials: {
              email: { label: 'Email', type: 'email' },
              password: { label: 'Password', type: 'password' },
            },
            /**
             * The attempt is counted before anything is checked — this runs for
             * the sign-in page's Server Action and for a direct POST to
             * /api/auth/callback/password alike, so a script cannot go around
             * the limit. A wrong password and an unknown email are refused the
             * same way, so the answer never reveals who is an admin.
             */
            async authorize(credentials, request) {
              const email = String(credentials?.email ?? '')
                .trim()
                .toLowerCase();
              const password = String(credentials?.password ?? '');
              const allowed = await allowSignInAttempt({
                address: clientAddress(request.headers),
                email,
              });
              if (!allowed) throw new TooManyAttempts();
              const expected = env.ADMIN_PASSWORD ?? '';
              // Both checks always run, so timing does not tell them apart.
              const isAdmin = isAllowedAdmin(email, setup.admins);
              const matches = expected !== '' && passwordMatches(password, expected);
              return isAdmin && matches ? { id: email, email } : null;
            },
          }),
        ]
      : []),
    ...(setup.google
      ? [Google({ clientId: env.AUTH_GOOGLE_ID, clientSecret: env.AUTH_GOOGLE_SECRET })]
      : []),
    ...(setup.devSignIn
      ? [
          Credentials({
            id: DEV_PROVIDER,
            name: 'Development sign-in',
            credentials: { email: { label: 'Email', type: 'email' } },
            authorize(credentials) {
              const email = String(credentials?.email ?? '')
                .trim()
                .toLowerCase();
              return isAllowedAdmin(email, setup.admins) ? { id: email, email } : null;
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    signIn({ user, account, profile }) {
      if (!isAllowedAdmin(user.email, setup.admins)) return false;
      // Google must have verified the address, or anyone could claim it.
      return account?.provider !== 'google' || profile?.email_verified === true;
    },
    jwt({ token, account }) {
      if (account) {
        token.provider = account.provider;
        if (account.provider === PASSWORD_PROVIDER && currentPasswordFingerprint) {
          token.passwordFingerprint = currentPasswordFingerprint;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (typeof token.provider === 'string') session.provider = token.provider;
      if (typeof token.passwordFingerprint === 'string') {
        session.passwordFingerprint = token.passwordFingerprint;
      }
      return session;
    },
  },
});
