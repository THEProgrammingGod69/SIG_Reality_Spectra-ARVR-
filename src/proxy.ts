import { type NextRequest, NextResponse } from 'next/server';

import { setup } from '@/lib/auth/base';
import { cookieRemovalsOnly, LOGIN_PATH } from '@/lib/auth/policy';
import { proxyAuth } from '@/lib/auth/proxy-auth';
import { adminFromSession } from '@/lib/auth/session-check';

/**
 * The first lock on the admin panel (rule 8): every /admin page except the
 * sign-in page needs an admin session. It is not the only lock — the panel
 * layout, every Server Action and the upload route check the session again.
 */

function toLogin(request: NextRequest) {
  const url = new URL(LOGIN_PATH, request.nextUrl);
  url.searchParams.set('callbackUrl', request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(url);
}

const guard = proxyAuth((request) => {
  if (request.nextUrl.pathname === LOGIN_PATH) return NextResponse.next();
  if (adminFromSession(request.auth) === null) return toLogin(request);
  return NextResponse.next();
});

export async function proxy(request: NextRequest, event: Parameters<typeof guard>[1]) {
  // Without a signing secret no session can exist: everything goes to the
  // sign-in page, which explains what is missing.
  if (!setup.secret) {
    return request.nextUrl.pathname === LOGIN_PATH ? NextResponse.next() : toLogin(request);
  }
  const response = (await guard(request, event)) ?? NextResponse.next();
  // Never re-issue the session here, or a prefetch answered after "Sign out"
  // would sign the admin back in; removals still pass (D-032).
  const cookies = response.headers.getSetCookie();
  if (cookies.length > 0) {
    response.headers.delete('set-cookie');
    for (const cookie of cookieRemovalsOnly(cookies)) response.headers.append('set-cookie', cookie);
  }
  return response;
}

export const config = { matcher: ['/admin', '/admin/:path*'] };
