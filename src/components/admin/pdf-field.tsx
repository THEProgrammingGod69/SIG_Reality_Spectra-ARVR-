'use client';

import { ExternalLink, FileText, Trash2 } from 'lucide-react';

import { Button } from '@/components/admin/ui/button';
import { Icon } from '@/components/ui/icon';
import { uploadLimits, type UploadTarget } from '@/lib/schemas/upload';

import { UploadDropzone } from './upload-dropzone';

type PdfFieldProps = {
  label: string;
  target: UploadTarget;
  /** The record the file is filed under; null for a site-wide file (the roles PDF). */
  recordId: string | null;
  value: string | null;
  onChange: (url: string | null) => void;
  error?: string | undefined;
};

/** One PDF: open the current file, replace it, or remove it. */
export function PdfField({ label, target, recordId, value, onChange, error }: PdfFieldProps) {
  const maxMb = Math.round(uploadLimits(target).maxBytes / (1024 * 1024));
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-2 text-body-sm font-medium text-foreground">{label}</legend>
      {value ? (
        <div className="flex flex-wrap items-center gap-3 rounded-control border p-3">
          <Icon icon={FileText} size="md" className="text-muted-foreground" />
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-body-sm text-foreground underline-offset-4 hover:underline"
          >
            Open the current PDF
            <Icon icon={ExternalLink} size="sm" />
          </a>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ms-auto"
            onClick={() => onChange(null)}
          >
            <Icon icon={Trash2} size="sm" />
            Remove
          </Button>
        </div>
      ) : null}
      <UploadDropzone
        target={target}
        recordId={recordId}
        label={value ? 'Replace the PDF' : 'Upload the PDF'}
        hint={`PDF only, up to ${maxMb} MB.`}
        onUploaded={(file) => onChange(file.url)}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </fieldset>
  );
}
