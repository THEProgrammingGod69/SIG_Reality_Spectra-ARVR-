import { CircleAlert, FlaskConical } from 'lucide-react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { Button } from '@/components/admin/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/admin/ui/card';
import { Input } from '@/components/admin/ui/input';
import { Label } from '@/components/admin/ui/label';
import { Separator } from '@/components/admin/ui/separator';
import { Icon } from '@/components/ui/icon';
import { BrandMark } from '@/components/ui/logo';
import { Skeleton } from '@/components/ui/skeleton';
import { signInForDevelopment, signInWithGoogle } from '@/lib/auth/actions';
import { setup } from '@/lib/auth/config';
import { safeCallbackPath } from '@/lib/auth/policy';
import { getAdminSession } from '@/lib/auth/session';
import { isDevelopment } from '@/lib/env';
import { siteConfig } from '@/lib/site';

export const metadata: Metadata = { title: 'Sign in' };

/** Auth.js error codes, said plainly. */
const ERRORS: Record<string, string> = {
  AccessDenied: 'That account is not on the admin list. Use an allowed account, or ask an admin.',
  CredentialsSignin: 'That account is not on the admin list.',
  Configuration: 'Sign-in is not configured correctly on this site.',
  Verification: 'That sign-in link has expired. Try again.',
};

export default function LoginPage({ searchParams }: PageProps<'/admin/login'>) {
  return (
    <main
      id="main-content"
      className="flex flex-1 items-center justify-center bg-background px-gutter py-16"
    >
      <Card className="w-full max-w-sm">
        <CardHeader className="justify-items-center text-center">
          <BrandMark className="size-12" preload />
          <CardTitle>
            <h1 className="text-display-sm">Admin sign-in</h1>
          </CardTitle>
          <CardDescription>{siteConfig.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-9 w-full" />}>
            <SignInOptions searchParams={searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}

async function SignInOptions({ searchParams }: Pick<PageProps<'/admin/login'>, 'searchParams'>) {
  const params = await searchParams;
  const callbackUrl = safeCallbackPath(params.callbackUrl);
  if ((await getAdminSession()) !== null) redirect(callbackUrl);

  const errorCode = typeof params.error === 'string' ? params.error : null;
  const error = errorCode ? (ERRORS[errorCode] ?? 'Sign-in failed. Try again.') : null;

  return (
    <div className="flex flex-col gap-6">
      {error ? (
        <p
          role="alert"
          className="flex gap-2 rounded-control border border-destructive/40 p-3 text-body-sm text-foreground"
        >
          <Icon icon={CircleAlert} size="sm" className="mt-0.5 text-destructive" />
          {error}
        </p>
      ) : null}

      {setup.google ? (
        <form action={signInWithGoogle}>
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <Button type="submit" className="w-full">
            Sign in with Google
          </Button>
        </form>
      ) : (
        <p className="text-body-sm text-muted-foreground">
          {isDevelopment
            ? 'Google sign-in is off until AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET are set (docs/SETUP_AUTH.md).'
            : 'Sign-in is not set up on this site yet. Ask the site maintainer.'}
        </p>
      )}

      {setup.devSignIn ? <DevelopmentSignIn callbackUrl={callbackUrl} /> : null}
    </div>
  );
}

/**
 * The development sign-in (D-030): never rendered — and refused by the server
 * — on a deployed site.
 */
function DevelopmentSignIn({ callbackUrl }: { callbackUrl: string }) {
  return (
    <>
      <Separator />
      <form action={signInForDevelopment} className="flex flex-col gap-3">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <p className="flex gap-2 text-xs text-muted-foreground">
          <Icon icon={FlaskConical} size="sm" className="text-warning" />
          Development sign-in: no password, allowlisted accounts only. Never available on the live
          site.
        </p>
        <div className="flex flex-col gap-2">
          <Label htmlFor="dev-email">Admin email</Label>
          <Input
            id="dev-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={setup.admins[0]}
          />
        </div>
        <Button type="submit" variant="secondary">
          Sign in (development)
        </Button>
      </form>
    </>
  );
}
