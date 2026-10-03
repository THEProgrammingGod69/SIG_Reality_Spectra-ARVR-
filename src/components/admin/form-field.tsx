import type { FieldValues, Path, RegisterOptions, UseFormReturn } from 'react-hook-form';
import type { ComponentProps, ReactNode } from 'react';

import { Checkbox } from '@/components/admin/ui/checkbox';
import { Label } from '@/components/admin/ui/label';
import { cn } from '@/lib/cn';

/** What a field's control needs to be wired to its label, hint and error. */
export type ControlProps = {
  id: string;
  'aria-invalid': boolean;
  'aria-describedby': string | undefined;
};

type FormFieldProps = {
  id: string;
  label: string;
  /** Shown under the control while there is no error. */
  hint?: ReactNode;
  error?: string | undefined;
  className?: string;
  children: (control: ControlProps) => ReactNode;
};

/**
 * A labelled form control with its hint and error, linked for screen readers
 * (`aria-describedby`, `aria-invalid`). Every admin form field goes through it.
 */
export function FormField({ id, label, hint, error, className, children }: FormFieldProps) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label htmlFor={id}>{label}</Label>
      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy })}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type CheckboxFieldProps = Omit<ComponentProps<typeof Checkbox>, 'children'> & {
  label: string;
  /** Shown under the label, e.g. what ticking it does on the site. */
  hint?: ReactNode;
  error?: string | undefined;
};

/** A checkbox with its label, hint and error: pass it `checkboxProps(form, …)`. */
export function CheckboxField({ label, hint, error, className, ...checkbox }: CheckboxFieldProps) {
  return (
    <label className={cn('flex items-start gap-3 text-body-sm text-foreground', className)}>
      <Checkbox {...checkbox} aria-invalid={Boolean(error)} className="mt-0.5" />
      <span>
        {label}
        {hint ? <span className="block text-xs text-muted-foreground">{hint}</span> : null}
        {error ? <span className="block text-xs text-destructive">{error}</span> : null}
      </span>
    </label>
  );
}

/**
 * `register()` plus the field's current value as the input's default, so the
 * server-rendered form already shows the saved values: without it, inputs are
 * empty until react-hook-form fills them in after hydration, and anything typed
 * before then is mixed with the loaded value.
 */
export function inputProps<Values extends FieldValues>(
  form: UseFormReturn<Values, unknown, unknown>,
  name: Path<Values>,
  options?: RegisterOptions<Values, Path<Values>>,
) {
  const value: unknown = form.getValues(name);
  return {
    ...form.register(name, options),
    defaultValue: value === null || value === undefined ? '' : String(value),
  };
}

/** `inputProps()` for a checkbox: the saved state as `defaultChecked`. */
export function checkboxProps<Values extends FieldValues>(
  form: UseFormReturn<Values, unknown, unknown>,
  name: Path<Values>,
) {
  return { ...form.register(name), defaultChecked: Boolean(form.getValues(name)) };
}
