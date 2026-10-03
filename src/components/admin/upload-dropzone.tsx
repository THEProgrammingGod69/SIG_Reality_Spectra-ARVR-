'use client';

import { CloudUpload, RotateCw, X } from 'lucide-react';
import { useId, useState } from 'react';

import { Button } from '@/components/admin/ui/button';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/cn';
import { MEDIA_KINDS, UPLOAD_TARGETS, type UploadTarget } from '@/lib/schemas/upload';

import { prepareFile, uploadPrepared } from './upload-file';

export type UploadedFile = {
  url: string;
  width: number | null;
  height: number | null;
  /** The record the file was filed under. */
  recordId: string | null;
  fileName: string;
};

type Item = {
  key: string;
  file: File;
  recordId: string | null;
  progress: number;
  error: string | null;
};

type UploadDropzoneProps = {
  target: UploadTarget;
  /**
   * The record the files belong to, or a function giving each file a new
   * record (a batch of new gallery photos).
   */
  recordId: string | null | (() => string);
  multiple?: boolean;
  label: string;
  hint?: string;
  disabled?: boolean;
  onUploaded: (file: UploadedFile) => void;
};

/**
 * Drop or pick files; each is prepared (images become WebP), uploaded straight
 * to storage with a progress bar, and handed to `onUploaded` when done. A
 * failed upload stays in the list with its reason and a retry button.
 */
export function UploadDropzone({
  target,
  recordId,
  multiple = false,
  label,
  hint,
  disabled = false,
  onUploaded,
}: UploadDropzoneProps) {
  const inputId = useId();
  const [items, setItems] = useState<Item[]>([]);
  const [dragging, setDragging] = useState(false);
  const isPdf = UPLOAD_TARGETS[target].kind === 'pdf';
  const accept = isPdf ? Object.keys(MEDIA_KINDS.pdf.types).join(',') : 'image/*';

  const update = (key: string, change: Partial<Item>) =>
    setItems((current) =>
      current.map((item) => (item.key === key ? { ...item, ...change } : item)),
    );

  async function run(item: Item) {
    update(item.key, { progress: 0, error: null });
    try {
      const prepared = await prepareFile(item.file, target);
      const url = await uploadPrepared(prepared, { target, recordId: item.recordId }, (progress) =>
        update(item.key, { progress }),
      );
      setItems((current) => current.filter((entry) => entry.key !== item.key));
      onUploaded({
        url,
        width: prepared.width,
        height: prepared.height,
        recordId: item.recordId,
        fileName: item.file.name,
      });
    } catch (error) {
      update(item.key, { error: error instanceof Error ? error.message : 'The upload failed.' });
    }
  }

  function add(files: FileList | null) {
    if (!files || disabled) return;
    const added = Array.from(files)
      .slice(0, multiple ? undefined : 1)
      .map((file): Item => ({
        key: crypto.randomUUID(),
        file,
        recordId: typeof recordId === 'function' ? recordId() : recordId,
        progress: 0,
        error: null,
      }));
    setItems((current) => [...current, ...added]);
    for (const item of added) void run(item);
  }

  return (
    <div className="flex flex-col gap-3">
      <label
        htmlFor={inputId}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          add(event.dataTransfer.files);
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center gap-2 rounded-card border border-dashed border-input px-6 py-8 text-center hover:border-ring',
          dragging && 'border-ring bg-secondary',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        <Icon icon={CloudUpload} size="lg" className="text-muted-foreground" />
        <span className="text-body-sm font-medium text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">
          {hint ?? `Drop ${multiple ? 'files' : 'a file'} here or click to choose.`}
        </span>
        <input
          id={inputId}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          className="sr-only"
          onChange={(event) => {
            add(event.currentTarget.files);
            event.currentTarget.value = '';
          }}
        />
      </label>

      {items.length > 0 ? (
        <ul className="flex flex-col gap-2" aria-label="Uploads in progress">
          {items.map((item) => (
            <li key={item.key} className="flex flex-col gap-2 rounded-control border p-3">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="truncate text-foreground">{item.file.name}</span>
                {item.error ? (
                  <span className="flex shrink-0 gap-1">
                    <Button type="button" size="sm" variant="ghost" onClick={() => void run(item)}>
                      <Icon icon={RotateCw} size="sm" />
                      Retry
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label={`Remove ${item.file.name}`}
                      onClick={() =>
                        setItems((current) => current.filter((entry) => entry.key !== item.key))
                      }
                    >
                      <Icon icon={X} size="sm" />
                    </Button>
                  </span>
                ) : (
                  <span className="text-muted-foreground">{Math.round(item.progress * 100)}%</span>
                )}
              </div>
              {item.error ? (
                <p role="alert" className="text-xs text-destructive">
                  {item.error}
                </p>
              ) : (
                <div
                  role="progressbar"
                  aria-label={`Uploading ${item.file.name}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(item.progress * 100)}
                  className="h-1 overflow-hidden rounded-full bg-secondary"
                >
                  {/* The bar grows with transform, not width (rule 4). */}
                  <div
                    className="h-full origin-left bg-primary"
                    style={{ transform: `scaleX(${item.progress})` }}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
