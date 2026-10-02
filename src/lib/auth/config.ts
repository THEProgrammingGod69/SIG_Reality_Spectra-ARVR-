import 'server-only';

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';

import { env } from '@/lib/env';

import { authSetup, isAllowedAdmin, LOGIN_PATH, SESSION_MAX_AGE_SECONDS } from './policy';

declare module 'next-auth' {
  interface Session {
    /** How this admin signed in: `google`, or `dev` for the development sign-in. */
    provider?: string;
  }
}

/** The development sign-in's provider id (D-030). */
export const DEV_PROVIDER = 'dev';

/** Auth.js error types that mean "not allowed in", not "something broke". */
const REFUSED = new Set(['AccessDenied', 'CredentialsSignin']);

/** What admin sign-in can do here: which ways in exist, who is allowed. */
export const setup = authSetup(env);

/**
 * Auth.js (D-030): JWT sessions, no database, no user table. Access control is
 * the ADMIN_EMAILS allowlist and nothing else.
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
      if (refused) console.warn('[auth] Refused a sign-in: the account is not on the allowlist.');
      else console.error('[auth]', error);
    },
  },
  providers: [
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
      if (account) token.provider = account.provider;
      return token;
    },
    session({ session, token }) {
      if (typeof token.provider === 'string') session.provider = token.provider;
      return session;
    },
  },
});
