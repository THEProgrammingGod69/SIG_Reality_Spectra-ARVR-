'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CircleAlert, CircleCheck, Send } from 'lucide-react';
import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import { type Path, useForm } from 'react-hook-form';
import type { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { ActionResult } from '@/lib/action-result';
import { blankToNull } from '@/lib/forms';
import { SPONSORSHIP_TYPES, SponsorshipFormSchema } from '@/lib/schemas/sponsorship';

type Values = z.input<typeof SponsorshipFormSchema>;
type Sent = z.output<typeof SponsorshipFormSchema>;

type Submit = (submission: {
  form: Values;
  website: string;
  turnstileToken: string | null;
}) => Promise<ActionResult<null>>;

const EMPTY: Values = {
  name: '',
  organisation: '',
  email: '',
  phone: null,
  type: SPONSORSHIP_TYPES[0].id,
  message: '',
};

/**
 * The sponsorship and collaboration request form on /contact (D-032). One
 * schema validates it here and in the Server Action (rule 3). Spam checks: a
 * honeypot field people never see, the Turnstile widget when its keys are
 * set, and a rate limit on the server.
 */
export function SponsorshipForm({
  action,
  turnstileSiteKey,
}: {
  action: Submit;
  /** Null where Turnstile is off (a developer's computer, the tests). */
  turnstileSiteKey: string | null;
}) {
  const form = useForm<Values, unknown, Sent>({
    resolver: zodResolver(SponsorshipFormSchema),
    defaultValues: EMPTY,
  });
  const { register, handleSubmit, formState, setError, reset } = form;
  const { errors, isSubmitting } = formState;
  const [token, setToken] = useState<string | null>(null);
  // A token is single-use: a new widget after every attempt.
  const [attempt, setAttempt] = useState(0);
  const [failure, setFailure] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const send = handleSubmit(async (values, event) => {
    setFailure(null);
    if (turnstileSiteKey && !token) {
      setFailure('Please complete the spam check first.');
      return;
    }
    const result = await action({
      form: values,
      website: honeypotValue(event?.target),
      turnstileToken: token,
    });
    setToken(null);
    setAttempt((count) => count + 1);
    if (!result.ok) {
      for (const issue of result.issues) {
        setError(issue.path as Path<Values>, { message: issue.message });
      }
      setFailure(result.message);
      return;
    }
    reset(EMPTY);
    setSent(true);
  });

  if (sent) {
    return (
      <div
        role="status"
        className="flex flex-col items-start gap-4 rounded-card border border-(--color-success)/40 bg-(--color-surface) p-8"
      >
        <Icon icon={CircleCheck} size="lg" className="text-(--color-success)" />
        <p className="font-display text-display-sm text-(--color-text)">Thank you — request sent</p>
        <Text tone="muted">
          It has reached the club’s team, who read every request and will reply to the email address
          you gave.
        </Text>
        <Button variant="secondary" size="sm" onClick={() => setSent(false)}>
          Send another request
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={send}
      noValidate
      aria-labelledby="sponsorship"
      className="grid gap-6 rounded-card border border-(--color-border) bg-(--color-surface) p-6 md:grid-cols-2 md:p-8"
    >
      <Field label="Your name" required error={errors.name?.message}>
        {(control) => (
          <Input {...control} {...register('name')} autoComplete="name" maxLength={80} />
        )}
      </Field>
      <Field label="Organisation" required error={errors.organisation?.message}>
        {(control) => (
          <Input
            {...control}
            {...register('organisation')}
            autoComplete="organization"
            maxLength={120}
          />
        )}
      </Field>
      <Field label="Email" required error={errors.email?.message}>
        {(control) => (
          <Input
            {...control}
            {...register('email')}
            type="email"
            autoComplete="email"
            maxLength={254}
          />
        )}
      </Field>
      <Field label="Phone (optional)" error={errors.phone?.message}>
        {(control) => (
          <Input
            {...control}
            {...register('phone', { setValueAs: blankToNull })}
            type="tel"
            autoComplete="tel"
            maxLength={20}
          />
        )}
      </Field>
      <Field label="What is it about?" error={errors.type?.message} className="md:col-span-2">
        {(control) => (
          <Select {...control} {...register('type')}>
            {SPONSORSHIP_TYPES.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field
        label="Message"
        required
        hint="What you have in mind: the event or work, dates, and what you are offering or looking for. 20 to 2,000 characters."
        error={errors.message?.message}
        className="md:col-span-2"
      >
        {(control) => <Textarea {...control} {...register('message')} rows={6} maxLength={2000} />}
      </Field>

      {/* The honeypot: hidden from people and screen readers, filled only by bots. */}
      <div aria-hidden="true" className="sr-only">
        <label htmlFor="sponsorship-website">Leave this field empty</label>
        <input
          id="sponsorship-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      {turnstileSiteKey ? (
        <TurnstileWidget
          key={attempt}
          siteKey={turnstileSiteKey}
          onToken={setToken}
          className="md:col-span-2"
        />
      ) : null}

      <div className="flex flex-col gap-4 md:col-span-2">
        {failure ? (
          <p role="alert" className="flex items-start gap-2 text-body-sm text-(--color-danger)">
            <Icon icon={CircleAlert} size="sm" className="mt-0.5" />
            {failure}
          </p>
        ) : null}
        <Button type="submit" icon={Send} loading={isSubmitting} className="self-start">
          Send request
        </Button>
        <Text size="sm" tone="muted">
          Your details are used only to reply to this request.
        </Text>
      </div>
    </form>
  );
}

/** The honeypot's value, read from the submitted form (it is not a react-hook-form field). */
function honeypotValue(form: unknown): string {
  if (!(form instanceof HTMLFormElement)) return '';
  const value = new FormData(form).get('website');
  return typeof value === 'string' ? value : '';
}

/* -------------------------------------------------------------------------- */
/* Cloudflare Turnstile                                                       */
/* -------------------------------------------------------------------------- */

type TurnstileApi = {
  render(
    container: HTMLElement,
    options: {
      sitekey: string;
      theme: 'dark';
      callback: (token: string) => void;
      'expired-callback': () => void;
      'error-callback': () => void;
    },
  ): string;
  remove(widgetId: string): void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/**
 * The Turnstile widget, rendered explicitly so it can be replaced after each
 * attempt (a token works once). Cloudflare's script loads only on /contact,
 * and only where the keys are set.
 */
function TurnstileWidget({
  siteKey,
  onToken,
  className,
}: {
  siteKey: string;
  onToken: (token: string | null) => void;
  className?: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const api = window.turnstile;
    if (!ready || !api || !container.current) return;
    const widgetId = api.render(container.current, {
      sitekey: siteKey,
      theme: 'dark',
      callback: onToken,
      'expired-callback': () => onToken(null),
      'error-callback': () => onToken(null),
    });
    return () => api.remove(widgetId);
  }, [ready, siteKey, onToken]);

  return (
    <div className={className}>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setReady(true)}
      />
      <div ref={container} />
    </div>
  );
}
