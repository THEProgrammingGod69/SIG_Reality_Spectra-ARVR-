'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import type { z } from 'zod';

import { CheckboxField, checkboxProps, FormField, inputProps } from '@/components/admin/form-field';
import { ConflictNotice, SaveBar, useRecordVersion } from '@/components/admin/form-feedback';
import { PdfField } from '@/components/admin/pdf-field';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/admin/ui/card';
import { Input } from '@/components/admin/ui/input';
import { useUnsavedChanges } from '@/components/admin/unsaved-changes';
import { blankToNull } from '@/lib/forms';
import {
  DEFAULT_RECRUITMENT,
  RecruitmentInputSchema,
  type RecruitmentSettings,
} from '@/lib/schemas/recruitment';

import { saveRecruitment } from '../actions';

type Values = z.input<typeof RecruitmentInputSchema>;
type Saved = z.output<typeof RecruitmentInputSchema>;

function valuesOf(settings: RecruitmentSettings | null): Values {
  if (!settings) return { ...DEFAULT_RECRUITMENT };
  const { open, formUrl, rolesPdfUrl } = settings;
  return { open, formUrl, rolesPdfUrl };
}

/**
 * Open or close recruitment, and set what applicants need: the Google Form
 * link (required while open) and the roles PDF (optional, "coming soon"
 * until uploaded, D-028). A save updates /recruitment and the header at once.
 */
export function RecruitmentForm({ settings }: { settings: RecruitmentSettings | null }) {
  const router = useRouter();
  const record = useRecordVersion(settings?.updatedAt ?? null);
  const form = useForm<Values, unknown, Saved>({
    resolver: zodResolver(RecruitmentInputSchema),
    defaultValues: valuesOf(settings),
  });
  const { control, handleSubmit, formState, setError, reset } = form;
  const { errors, isDirty, isSubmitting } = formState;
  useUnsavedChanges(isDirty);

  const save = handleSubmit(async (values) => {
    const saved = record.saved(
      await saveRecruitment(values, record.version),
      'Saved. /recruitment and the header show it now.',
      setError,
    );
    if (!saved) return;
    reset(valuesOf(saved));
    router.refresh();
  });

  return (
    <form onSubmit={save} noValidate className="flex flex-col gap-6">
      {record.conflict ? <ConflictNotice /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Status and application form</CardTitle>
          <CardDescription>
            Applications happen in a Google Form; the Recruitment page links to it while recruitment
            is open. The domains stay on the page either way.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <CheckboxField
            {...checkboxProps(form, 'open')}
            label="Recruitment is open"
            hint="Shows “Apply now” on /recruitment and marks the header’s Recruitment button as open."
            error={errors.open?.message}
          />
          <FormField
            id="formUrl"
            label="Application form link"
            hint="The Google Form’s share link (https://forms.gle/…). Needed to open recruitment."
            error={errors.formUrl?.message}
          >
            {(field) => (
              <Input
                {...field}
                type="url"
                placeholder="https://forms.gle/"
                {...inputProps(form, 'formUrl', { setValueAs: blankToNull })}
              />
            )}
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Roles and responsibilities</CardTitle>
          <CardDescription>
            Optional. Until a PDF is uploaded, the page says the document is coming soon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Controller
            control={control}
            name="rolesPdfUrl"
            render={({ field }) => (
              <PdfField
                label="Roles PDF"
                target="roles-pdf"
                recordId={null}
                value={field.value ?? null}
                onChange={field.onChange}
                error={errors.rolesPdfUrl?.message}
              />
            )}
          />
        </CardContent>
      </Card>

      <SaveBar
        exists={record.version !== null}
        createLabel="Save settings"
        isDirty={isDirty}
        isSubmitting={isSubmitting}
      />
    </form>
  );
}
