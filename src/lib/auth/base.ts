import 'server-only';

import type { NextAuthConfig } from 'next-auth';

import { env } from '@/lib/env';

import {
  authSetup,
  LOGIN_PATH,
  PASSWORD_PROVIDER,
  passwordFingerprint,
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

/**
 * What reading a session needs, and nothing more: the secret, the cookie and
 * token rules, and the two callbacks that turn a token into a session. The
 * full Auth.js setup (`config.ts`: providers, the attempt limit, the data
 * layer) builds on it, and so does the proxy's slim instance (`proxy-auth.ts`),
 * which Netlify runs as an edge function and must stay free of the data layer
 * (D-041).
 */

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

export const sessionConfig = {
  secret: env.AUTH_SECRET,
  // Netlify and Vercel serve the site on their own, preview and custom hostnames.
  trustHost: true,
  session: { strategy: 'jwt', maxAge: SESSION_MAX_AGE_SECONDS },
  pages: { signIn: LOGIN_PATH, error: LOGIN_PATH },
  callbacks: {
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
} satisfies Omit<NextAuthConfig, 'providers'>;
