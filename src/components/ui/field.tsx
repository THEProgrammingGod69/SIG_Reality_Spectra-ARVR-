'use client';

import { CircleAlert, ChevronDown } from 'lucide-react';
import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';

import { cn } from '@/lib/cn';

import { Icon } from './icon';

/**
 * Form fields: Field (label, hint, error) plus Input, Textarea and Select.
 *
 * Field wires the accessibility for you — the label's `htmlFor`, the control's
 * `aria-describedby` (hint + error) and `aria-invalid` — and hands those props
 * to its child render function, which spreads them onto a control alongside
 * react-hook-form's `register()` (the sponsorship form on /contact).
 *
 * The control border is `--color-subtle`, the lightest neutral that clears
 * WCAG's 3:1 for component boundaries on every surface (contrast test).
 */

export type FieldControlProps = {
  id: string;
  'aria-describedby'?: string;
  'aria-invalid'?: true;
  required?: boolean;
};

type FieldProps = {
  label: string;
  hint?: string;
  /** Validation message; when set, the control is marked invalid. */
  error?: string | undefined;
  required?: boolean;
  className?: string;
  children: (control: FieldControlProps) => ReactNode;
};

export function Field({ label, hint, error, required = false, className, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={id} className="text-body-sm font-medium text-(--color-text)">
        {label}
        {required ? (
          <span aria-hidden="true" className="text-(--color-accent)">
            {' '}
            *
          </span>
        ) : null}
      </label>
      {children({
        id,
        'aria-describedby': describedBy,
        ...(error ? { 'aria-invalid': true as const } : {}),
        required,
      })}
      {hint ? (
        <p id={hintId} className="text-body-sm text-(--color-muted)">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="flex items-start gap-1.5 text-body-sm text-(--color-danger)">
          <Icon icon={CircleAlert} size="sm" className="mt-0.5" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

const control =
  'w-full rounded-control border border-(--color-subtle) bg-(--color-surface-raised) px-4 text-body-sm text-(--color-text) ' +
  'placeholder:text-(--color-subtle) focus-visible:border-(--color-accent) aria-invalid:border-(--color-danger) ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

export function Input({
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> }) {
  return <input className={cn(control, 'h-11', className)} {...rest} />;
}

export function Textarea({
  className,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { ref?: Ref<HTMLTextAreaElement> }) {
  return <textarea className={cn(control, 'min-h-32 resize-y py-3', className)} {...rest} />;
}

export function Select({
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { ref?: Ref<HTMLSelectElement> }) {
  return (
    <div className="relative">
      <select
        className={cn(
          control,
          'h-11 cursor-pointer appearance-none pr-10 [&_option]:bg-(--color-surface-raised)',
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      <Icon
        icon={ChevronDown}
        size="sm"
        className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-(--color-muted)"
      />
    </div>
  );
}
