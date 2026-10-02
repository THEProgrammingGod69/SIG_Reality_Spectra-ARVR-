import { type NextRequest, NextResponse } from 'next/server';

import { auth, setup } from '@/lib/auth/config';
import { LOGIN_PATH } from '@/lib/auth/policy';
import { adminFromSession } from '@/lib/auth/session';

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

const guard = auth((request) => {
  if (request.nextUrl.pathname === LOGIN_PATH) return NextResponse.next();
  if (adminFromSession(request.auth) === null) return toLogin(request);
  return NextResponse.next();
});

export function proxy(request: NextRequest, event: Parameters<typeof guard>[1]) {
  // Without a signing secret no session can exist: everything goes to the
  // sign-in page, which explains what is missing.
  if (!setup.secret) {
    return request.nextUrl.pathname === LOGIN_PATH ? NextResponse.next() : toLogin(request);
  }
  return guard(request, event);
}

export const config = { matcher: ['/admin', '/admin/:path*'] };
