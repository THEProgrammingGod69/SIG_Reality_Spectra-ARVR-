import 'server-only';

import NextAuth from 'next-auth';

import { sessionConfig } from './base';

/**
 * The proxy's Auth.js instance: it only reads and checks the session cookie.
 * No providers, so none of the sign-in code — and none of the data layer it
 * uses — is bundled into the proxy, which Netlify runs as an edge function
 * (D-041). Signing in goes through `/api/auth` and the full `config.ts`.
 */
export const { auth: proxyAuth } = NextAuth({ ...sessionConfig, providers: [] });
