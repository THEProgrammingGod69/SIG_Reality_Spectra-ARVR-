'use client';

import { Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef } from 'react';

import { Button } from '@/components/admin/ui/button';
import { Input } from '@/components/admin/ui/input';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/cn';
import type { Image as StoredImage } from '@/lib/schemas/image';
import type { UploadTarget } from '@/lib/schemas/upload';

import { FormField } from './form-field';
import { UploadDropzone, type UploadedFile } from './upload-dropzone';

/** Field errors for one image, as react-hook-form reports them. */
type ImageErrors = { alt?: { message?: string }; message?: string } | undefined;

function toImage(file: UploadedFile, alt: string): StoredImage {
  // Images always have a measured size; the fallback only satisfies the type.
  return { url: file.url, alt, width: file.width ?? 1, height: file.height ?? 1 };
}

type ImageFieldProps = {
  id: string;
  label: string;
  target: UploadTarget;
  recordId: string;
  value: StoredImage | null;
  onChange: (image: StoredImage | null) => void;
  defaultAlt: string;
  error?: ImageErrors;
  /** The preview's frame, e.g. `aspect-4/5` for posters. */
  frame: string;
};

/**
 * One image with its alt text: a poster, later a team photo. Any aspect ratio
 * is accepted and shown whole (D-031).
 */
export function ImageField({
  id,
  label,
  target,
  recordId,
  value,
  onChange,
  defaultAlt,
  error,
  frame,
}: ImageFieldProps) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-2 text-body-sm font-medium text-foreground">{label}</legend>
      {value ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <div
            className={cn(
              'relative w-40 shrink-0 overflow-hidden rounded-control bg-secondary',
              frame,
            )}
          >
            <Image src={value.url} alt={value.alt} fill sizes="10rem" className="object-contain" />
          </div>
          <div className="flex flex-1 flex-col gap-3">
            <FormField
              id={`${id}-alt`}
              label="Describe the image (alt text)"
              hint="What someone who cannot see it needs to know."
              error={error?.alt?.message}
            >
              {(control) => (
                <Input
                  {...control}
                  value={value.alt}
                  onChange={(event) => onChange({ ...value, alt: event.target.value })}
                />
              )}
            </FormField>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() => onChange(null)}
            >
              <Icon icon={Trash2} size="sm" />
              Remove
            </Button>
          </div>
        </div>
      ) : null}
      <UploadDropzone
        target={target}
        recordId={recordId}
        label={value ? 'Replace the image' : 'Upload an image'}
        hint="Any shape; it is shown whole. JPEG, PNG, WebP or AVIF."
        onUploaded={(file) => onChange(toImage(file, value?.alt || defaultAlt))}
      />
      {error?.message ? <p className="text-xs text-destructive">{error.message}</p> : null}
    </fieldset>
  );
}

type PhotoListFieldProps = {
  id: string;
  label: string;
  target: UploadTarget;
  recordId: string;
  value: StoredImage[];
  onChange: (photos: StoredImage[]) => void;
  defaultAlt: string;
  max: number;
  errors?: (ImageErrors | undefined)[] | { message?: string } | undefined;
  disabled?: boolean;
};

/** A list of photos, each with alt text: an event's photos. */
export function PhotoListField({
  id,
  label,
  target,
  recordId,
  value,
  onChange,
  defaultAlt,
  max,
  errors,
  disabled = false,
}: PhotoListFieldProps) {
  // Uploads finish one by one between renders; each must add to the latest
  // list, not to the list as it was when the upload started.
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  }, [value]);
  const itemErrors = Array.isArray(errors) ? errors : [];
  const listError = !Array.isArray(errors) ? errors?.message : undefined;
  const full = value.length >= max;

  return (
    <fieldset className="flex flex-col gap-3" disabled={disabled}>
      <legend className="mb-2 text-body-sm font-medium text-foreground">
        {label}{' '}
        <span className="font-normal text-muted-foreground">
          ({value.length} of {max})
        </span>
      </legend>
      {value.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {value.map((photo, index) => (
            <li key={photo.url} className="flex gap-3 rounded-control border p-3">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-control bg-secondary">
                <Image src={photo.url} alt={photo.alt} fill sizes="5rem" className="object-cover" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <FormField
                  id={`${id}-${index}-alt`}
                  label={`Photo ${index + 1}: alt text`}
                  error={itemErrors[index]?.alt?.message}
                >
                  {(control) => (
                    <Input
                      {...control}
                      value={photo.alt}
                      onChange={(event) =>
                        onChange(
                          value.map((entry, at) =>
                            at === index ? { ...entry, alt: event.target.value } : entry,
                          ),
                        )
                      }
                    />
                  )}
                </FormField>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="self-start"
                  onClick={() => onChange(value.filter((_, at) => at !== index))}
                >
                  <Icon icon={Trash2} size="sm" />
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      <UploadDropzone
        target={target}
        recordId={recordId}
        multiple
        disabled={disabled || full}
        label={full ? `The limit of ${max} photos is reached` : 'Upload photos'}
        hint="Select many at once. Any shape; they are converted to WebP in your browser."
        onUploaded={(file) => {
          latest.current = [...latest.current, toImage(file, defaultAlt)].slice(0, max);
          onChange(latest.current);
        }}
      />
      {listError ? <p className="text-xs text-destructive">{listError}</p> : null}
    </fieldset>
  );
}
