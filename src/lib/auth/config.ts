import 'server-only';

import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';

import { allowSignInAttempt } from '@/lib/data';
import { env } from '@/lib/env';

import { currentPasswordFingerprint, sessionConfig, setup } from './base';
import {
  clientAddress,
  DEV_PROVIDER,
  isAllowedAdmin,
  PASSWORD_PROVIDER,
  passwordMatches,
} from './policy';

export { currentPasswordFingerprint, DEV_PROVIDER, PASSWORD_PROVIDER, setup };

/** Auth.js error types that mean "not allowed in", not "something broke". */
const REFUSED = new Set(['AccessDenied', 'CredentialsSignin']);

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
  ...sessionConfig,
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
    ...sessionConfig.callbacks,
    signIn({ user, account, profile }) {
      if (!isAllowedAdmin(user.email, setup.admins)) return false;
      // Google must have verified the address, or anyone could claim it.
      return account?.provider !== 'google' || profile?.email_verified === true;
    },
  },
});
