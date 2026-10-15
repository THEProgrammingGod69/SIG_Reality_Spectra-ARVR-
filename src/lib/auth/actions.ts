'use server';

import { AuthError, CredentialsSignin } from 'next-auth';
import { redirect } from 'next/navigation';

import { DEV_PROVIDER, PASSWORD_PROVIDER, setup, signIn, signOut } from './config';
import { LOGIN_PATH, safeCallbackPath } from './policy';

/** Back to the sign-in page with an error code the page explains. */
function failSignIn(error: string, callbackUrl: string): never {
  const query = new URLSearchParams({ error, callbackUrl });
  redirect(`${LOGIN_PATH}?${query.toString()}`);
}

export async function signInWithGoogle(formData: FormData) {
  const callbackUrl = safeCallbackPath(formData.get('callbackUrl')?.toString());
  if (!setup.google) failSignIn('Configuration', callbackUrl);
  await signIn('google', { redirectTo: callbackUrl });
}

/**
 * The email + password sign-in. The password travels only in this POST body:
 * a refusal redirects with an error code and the callback, never the fields.
 * A wrong password and an email that is not on the allowlist get the same
 * answer, so the page never reveals who the admins are.
 */
export async function signInWithPassword(formData: FormData) {
  const callbackUrl = safeCallbackPath(formData.get('callbackUrl')?.toString());
  if (!setup.password) failSignIn('Configuration', callbackUrl);
  try {
    await signIn(PASSWORD_PROVIDER, {
      email: formData.get('email')?.toString() ?? '',
      password: formData.get('password')?.toString() ?? '',
      redirectTo: callbackUrl,
    });
  } catch (error) {
    // A refused sign-in is an AuthError; success is a redirect, rethrown below.
    if (error instanceof AuthError) {
      const limited = error instanceof CredentialsSignin && error.code === 'too_many_attempts';
      failSignIn(limited ? 'TooManyAttempts' : 'CredentialsSignin', callbackUrl);
    }
    throw error;
  }
}

/** The development sign-in (D-030): refused wherever it is not enabled. */
export async function signInForDevelopment(formData: FormData) {
  const callbackUrl = safeCallbackPath(formData.get('callbackUrl')?.toString());
  if (!setup.devSignIn) failSignIn('Configuration', callbackUrl);
  try {
    await signIn(DEV_PROVIDER, {
      email: formData.get('email')?.toString() ?? '',
      redirectTo: callbackUrl,
    });
  } catch (error) {
    // A refused sign-in is an AuthError; success is a redirect, rethrown below.
    if (error instanceof AuthError) failSignIn('AccessDenied', callbackUrl);
    throw error;
  }
}

export async function signOutAdmin() {
  await signOut({ redirectTo: LOGIN_PATH });
}
