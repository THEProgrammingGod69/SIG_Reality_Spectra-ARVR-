'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { type ComponentProps, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

import { blankToNull, FormField, inputProps } from '@/components/admin/form-field';
import { ConflictNotice, reportFailure } from '@/components/admin/form-feedback';
import { useToast } from '@/components/admin/toaster';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/admin/ui/alert-dialog';
import { Button } from '@/components/admin/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/admin/ui/card';
import { Input } from '@/components/admin/ui/input';
import { NativeSelect } from '@/components/admin/ui/native-select';
import { useUnsavedChanges } from '@/components/admin/unsaved-changes';
import { UploadDropzone } from '@/components/admin/upload-dropzone';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { CATEGORIES, type Category } from '@/lib/schemas/category';
import { type GalleryPhoto, GalleryPhotoInputSchema } from '@/lib/schemas/gallery';

import { createGalleryPhotos, deleteGalleryPhoto, updateGalleryPhoto } from '../actions';

type PhotoValues = z.input<typeof GalleryPhotoInputSchema>;

/** The batch form validates each new photo with the one GalleryPhoto schema (rule 3). */
const BatchSchema = z.object({ photos: z.array(GalleryPhotoInputSchema) });
type BatchValues = z.input<typeof BatchSchema>;

function CategorySelect(props: ComponentProps<typeof NativeSelect>) {
  return (
    <NativeSelect {...props}>
      {CATEGORIES.map((category) => (
        <option key={category.id} value={category.id}>
          {category.label}
        </option>
      ))}
    </NativeSelect>
  );
}

/** Upload new club photos in a batch, then edit or delete the ones saved. */
export function GalleryManager({ photos }: { photos: GalleryPhoto[] }) {
  return (
    <>
      <NewPhotos />
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>
              Club photos <span className="text-muted-foreground">({photos.length})</span>
            </h2>
          </CardTitle>
          <CardDescription>
            Newest first. Photos of timeline events are edited in their event.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {photos.length === 0 ? (
            <EmptyState
              title="No club photos yet"
              description="Upload some above. The gallery also shows the photos of every event on the timeline."
            />
          ) : (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-4">
              {photos.map((photo) => (
                <li key={photo.id}>
                  <SavedPhoto photo={photo} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function NewPhotos() {
  const router = useRouter();
  const { toast } = useToast();
  const [category, setCategory] = useState<Category>(CATEGORIES[0].id);
  const form = useForm<BatchValues, unknown, z.output<typeof BatchSchema>>({
    resolver: zodResolver(BatchSchema),
    defaultValues: { photos: [] },
  });
  const { control, handleSubmit, formState, setError } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'photos', keyName: 'key' });
  useUnsavedChanges(fields.length > 0);

  const save = handleSubmit(async ({ photos }) => {
    const result = await createGalleryPhotos(photos);
    if (!result.ok) {
      toast(result.message, 'error');
      return;
    }
    const { saved, failed } = result.data;
    if (saved.length > 0)
      toast(
        `${saved.length} photo${saved.length === 1 ? '' : 's'} added to the gallery.`,
        'success',
      );
    // Keep only the photos that were not saved, each with its reason.
    const remaining = form.getValues('photos').filter((photo) => !saved.includes(photo.id));
    form.reset({ photos: remaining });
    failed.forEach((failure) => {
      const index = remaining.findIndex((photo) => photo.id === failure.id);
      if (index >= 0)
        setError(`photos.${index}.image.alt`, { message: failure.error ?? 'Not saved' });
    });
    if (failed.length > 0)
      toast(`${failed.length} photo${failed.length === 1 ? '' : 's'} could not be saved.`, 'error');
    router.refresh();
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Add club photos</h2>
        </CardTitle>
        <CardDescription>
          Pick many at once. Describe each one, check its category, then save them together.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} noValidate className="flex flex-col gap-5">
          <div className="flex flex-col gap-2 sm:max-w-xs">
            <FormField id="batch-category" label="Category for new uploads">
              {(field) => (
                <CategorySelect
                  {...field}
                  value={category}
                  onChange={(event) => setCategory(event.target.value as Category)}
                />
              )}
            </FormField>
          </div>
          <UploadDropzone
            target="gallery-photo"
            recordId={() => crypto.randomUUID()}
            multiple
            label="Upload photos"
            hint="Any shape. They are converted to WebP in your browser."
            onUploaded={(file) =>
              append({
                id: file.recordId!,
                image: { url: file.url, alt: '', width: file.width ?? 1, height: file.height ?? 1 },
                category,
                caption: null,
              })
            }
          />
          {fields.length > 0 ? (
            <>
              <ul className="flex flex-col gap-3">
                {fields.map((field, index) => {
                  const errors = formState.errors.photos?.[index];
                  return (
                    <li
                      key={field.key}
                      className="flex flex-col gap-3 rounded-control border p-3 sm:flex-row"
                    >
                      <div className="relative size-24 shrink-0 overflow-hidden rounded-control bg-secondary">
                        <Image
                          src={field.image.url}
                          alt=""
                          fill
                          sizes="6rem"
                          className="object-cover"
                        />
                      </div>
                      <div className="grid flex-1 gap-3 sm:grid-cols-2">
                        <FormField
                          id={`new-${index}-alt`}
                          label="Describe the photo (alt text)"
                          error={errors?.image?.alt?.message}
                          className="sm:col-span-2"
                        >
                          {(control) => (
                            <Input
                              {...control}
                              {...inputProps(form, `photos.${index}.image.alt`)}
                            />
                          )}
                        </FormField>
                        <FormField
                          id={`new-${index}-category`}
                          label="Category"
                          error={errors?.category?.message}
                        >
                          {(control) => (
                            <CategorySelect
                              {...control}
                              {...inputProps(form, `photos.${index}.category`)}
                            />
                          )}
                        </FormField>
                        <FormField
                          id={`new-${index}-caption`}
                          label="Caption (optional)"
                          error={errors?.caption?.message}
                        >
                          {(control) => (
                            <Input
                              {...control}
                              maxLength={120}
                              {...inputProps(form, `photos.${index}.caption`, {
                                setValueAs: blankToNull,
                              })}
                            />
                          )}
                        </FormField>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Discard this photo"
                        onClick={() => remove(index)}
                      >
                        <Icon icon={Trash2} size="sm" />
                      </Button>
                    </li>
                  );
                })}
              </ul>
              <Button type="submit" className="self-start" disabled={formState.isSubmitting}>
                {formState.isSubmitting
                  ? 'Saving…'
                  : `Save ${fields.length} photo${fields.length === 1 ? '' : 's'}`}
              </Button>
            </>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}

function SavedPhoto({ photo }: { photo: GalleryPhoto }) {
  const router = useRouter();
  const { toast, notify } = useToast();
  const [expectedUpdatedAt, setExpectedUpdatedAt] = useState(photo.updatedAt);
  const [conflict, setConflict] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const values = (from: GalleryPhoto): PhotoValues => ({
    id: from.id,
    image: from.image,
    category: from.category,
    caption: from.caption,
  });
  const form = useForm<PhotoValues, unknown, z.output<typeof GalleryPhotoInputSchema>>({
    resolver: zodResolver(GalleryPhotoInputSchema),
    defaultValues: values(photo),
  });
  const { handleSubmit, formState, setError, reset } = form;
  useUnsavedChanges(formState.isDirty);
  const errors = formState.errors;

  const save = handleSubmit(async (input) => {
    setConflict(false);
    const result = await updateGalleryPhoto(photo.id, expectedUpdatedAt, input);
    if (!result.ok) {
      setConflict(result.reason === 'conflict');
      reportFailure(result, setError, toast);
      return;
    }
    notify(result, 'Photo saved.');
    setExpectedUpdatedAt(result.data.updatedAt);
    reset(values(result.data));
    router.refresh();
  });

  async function remove() {
    const result = await deleteGalleryPhoto(photo.id, expectedUpdatedAt);
    notify(result, 'Photo deleted.');
    if (result.ok) router.refresh();
    else setConflict(result.reason === 'conflict');
  }

  return (
    <form
      onSubmit={save}
      noValidate
      className="flex h-full flex-col overflow-hidden rounded-card border bg-background"
    >
      <div className="relative aspect-square bg-secondary">
        <Image
          src={photo.image.url}
          alt={photo.image.alt}
          fill
          sizes="(min-width: 64rem) 20rem, 50vw"
          className="object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-3">
        {conflict ? <ConflictNotice /> : null}
        <FormField id={`photo-${photo.id}-alt`} label="Alt text" error={errors.image?.alt?.message}>
          {(control) => <Input {...control} {...inputProps(form, 'image.alt')} />}
        </FormField>
        <FormField
          id={`photo-${photo.id}-category`}
          label="Category"
          error={errors.category?.message}
        >
          {(control) => <CategorySelect {...control} {...inputProps(form, 'category')} />}
        </FormField>
        <FormField
          id={`photo-${photo.id}-caption`}
          label="Caption (optional)"
          error={errors.caption?.message}
        >
          {(control) => (
            <Input
              {...control}
              maxLength={120}
              {...inputProps(form, 'caption', { setValueAs: blankToNull })}
            />
          )}
        </FormField>
        <div className="mt-auto flex gap-2">
          <Button type="submit" size="sm" disabled={!formState.isDirty || formState.isSubmitting}>
            {formState.isSubmitting ? 'Saving…' : 'Save'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="ms-auto text-destructive hover:text-destructive"
            onClick={() => setConfirmDelete(true)}
          >
            <Icon icon={Trash2} size="sm" />
            Delete
          </Button>
        </div>
      </div>
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this photo?</AlertDialogTitle>
            <AlertDialogDescription>
              It is removed from the gallery and its file is deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction destructive onClick={() => void remove()}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
