'use server';

import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';

import { DEV_PROVIDER, setup, signIn, signOut } from './config';
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
