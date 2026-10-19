import { CircleAlert, FlaskConical } from 'lucide-react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { DecodeText } from '@/components/motion/decode-text';
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
import { HudCorners } from '@/components/ui/hud-corners';
import { Icon } from '@/components/ui/icon';
import { BrandMark } from '@/components/ui/logo';
import { Skeleton } from '@/components/ui/skeleton';
import { signInForDevelopment, signInWithGoogle, signInWithPassword } from '@/lib/auth/actions';
import { setup } from '@/lib/auth/config';
import { safeCallbackPath } from '@/lib/auth/policy';
import { getAdminSession } from '@/lib/auth/session';
import { env, envWarnings, isDevelopment } from '@/lib/env';
import { siteConfig } from '@/lib/site';

import { SubmitButton } from './submit-button';

export const metadata: Metadata = { title: 'Sign in' };

/** Auth.js error codes (and our own), said plainly. */
const ERRORS: Record<string, string> = {
  AccessDenied: 'That account is not on the admin list. Use an allowed account, or ask an admin.',
  // One message for a wrong password and an unknown email: never say which.
  CredentialsSignin: 'Wrong email or password.',
  TooManyAttempts: 'Too many sign-in attempts. Wait 15 minutes, then try again.',
  Configuration: 'Sign-in is not configured correctly on this site.',
  Verification: 'That sign-in link has expired. Try again.',
};

/**
 * The one admin page anyone can open. The card sits in the HUD's lock-on
 * frame (D-038), which settles once as the page opens — `transform` and
 * `opacity` only, instant under reduced motion — and the mono eyebrow decodes
 * like the site's readouts. Admin UI otherwise (D-030).
 */
export default function LoginPage({ searchParams }: PageProps<'/admin/login'>) {
  return (
    <main
      id="main-content"
      className="flex flex-1 items-center justify-center bg-background px-gutter py-16"
    >
      <div className="relative w-full max-w-sm">
        <HudCorners
          className="-inset-2 animate-lock-on text-primary sm:-inset-3"
          cornerClassName="size-5"
        />
        <Card>
          <CardHeader className="justify-items-center text-center">
            <BrandMark className="size-12" preload />
            <p className="font-mono text-label text-muted-foreground uppercase">
              <DecodeText text="Restricted · Lab access" />
            </p>
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
      </div>
    </main>
  );
}

/** The error to explain, from our redirect (`error`) or Auth.js's own (`error` + `code`). */
function errorMessage(params: Record<string, string | string[] | undefined>): string | null {
  const code = typeof params.error === 'string' ? params.error : null;
  if (code === null) return null;
  if (code === 'CredentialsSignin' && params.code === 'too_many_attempts') {
    return ERRORS.TooManyAttempts ?? null;
  }
  return ERRORS[code] ?? 'Sign-in failed. Try again.';
}

async function SignInOptions({ searchParams }: Pick<PageProps<'/admin/login'>, 'searchParams'>) {
  const params = await searchParams;
  const callbackUrl = safeCallbackPath(params.callbackUrl);
  if ((await getAdminSession()) !== null) redirect(callbackUrl);

  const error = errorMessage(params);

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

      {setup.password ? <PasswordSignIn callbackUrl={callbackUrl} /> : null}

      {setup.password && setup.google ? <Separator /> : null}

      {setup.google ? (
        <form action={signInWithGoogle}>
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <Button type="submit" variant={setup.password ? 'outline' : 'default'} className="w-full">
            Sign in with Google
          </Button>
        </form>
      ) : null}

      {!setup.password && !setup.google ? <NotSetUp /> : null}

      {setup.devSignIn ? <DevelopmentSignIn callbackUrl={callbackUrl} /> : null}
    </div>
  );
}

/** The sign-in settings this deployment is missing, by name (never a value). */
function missingSignInSettings(): string[] {
  return [
    env.AUTH_SECRET ? null : 'AUTH_SECRET',
    env.ADMIN_EMAILS?.length ? null : 'ADMIN_EMAILS',
    env.ADMIN_PASSWORD ? null : 'ADMIN_PASSWORD',
  ].filter((name): name is string => name !== null);
}

/**
 * Sign-in is off: say exactly which settings are missing or were ignored, so
 * whoever looks after the site can fix it in one go (D-041). Names only.
 */
function NotSetUp() {
  const missing = missingSignInSettings();
  const ignored = envWarnings.filter((warning) =>
    /^(AUTH_SECRET|ADMIN_EMAILS|ADMIN_PASSWORD)\b/.test(warning),
  );
  return (
    <div className="flex flex-col gap-2 text-body-sm text-muted-foreground">
      <p>
        Sign-in is not set up on this site yet.
        {missing.length > 0 ? (
          <>
            {' '}
            Add {missing.join(', ')} to the site&apos;s environment variables
            {isDevelopment ? ' (.env.local)' : ' in Netlify or Vercel'}, then redeploy
            (docs/SETUP_AUTH.md).
          </>
        ) : null}
      </p>
      {ignored.map((warning) => (
        <p key={warning}>{warning}</p>
      ))}
    </div>
  );
}

/**
 * Email + password: any allowlisted email with ADMIN_PASSWORD. The fields keep
 * the browser's password manager working (`username`, `current-password`).
 */
function PasswordSignIn({ callbackUrl }: { callbackUrl: string }) {
  return (
    <form action={signInWithPassword} className="flex flex-col gap-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="sign-in-email">Email</Label>
        <Input
          id="sign-in-email"
          name="email"
          type="email"
          required
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="sign-in-password">Password</Label>
        <Input
          id="sign-in-password"
          name="password"
          type="password"
          required
          maxLength={200}
          autoComplete="current-password"
        />
      </div>
      <SubmitButton pending="Checking…" className="w-full">
        Sign in
      </SubmitButton>
    </form>
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
