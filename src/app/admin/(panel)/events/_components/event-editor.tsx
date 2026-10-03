'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import type { z } from 'zod';

import { blankToNull, checkboxProps, FormField, inputProps } from '@/components/admin/form-field';
import { ConflictNotice, reportFailure } from '@/components/admin/form-feedback';
import { ImageField, PhotoListField } from '@/components/admin/image-fields';
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
import { Checkbox } from '@/components/admin/ui/checkbox';
import { Input } from '@/components/admin/ui/input';
import { NativeSelect } from '@/components/admin/ui/native-select';
import { Textarea } from '@/components/admin/ui/textarea';
import { useUnsavedChanges } from '@/components/admin/unsaved-changes';
import { Icon } from '@/components/ui/icon';
import { fromClubLocalInput, toClubLocalInput } from '@/lib/dates';
import { CATEGORIES } from '@/lib/schemas/category';
import {
  EVENT_MODES,
  type Event,
  EventInputSchema,
  hasEnded,
  MAX_EVENT_PHOTOS,
} from '@/lib/schemas/event';

import { createEvent, deleteEvent, updateEvent } from '../actions';

type Values = z.input<typeof EventInputSchema>;
type Saved = z.output<typeof EventInputSchema>;

/** The form's values for a stored event: its editable fields only. */
function valuesOf(event: Event): Values {
  const { createdAt: _c, updatedAt: _u, updatedBy: _b, ...fields } = event;
  return fields;
}

function blankEvent(id: string): Values {
  return {
    id,
    title: '',
    category: CATEGORIES[0].id,
    summary: '',
    description: '',
    startsAt: '',
    endsAt: null,
    venue: '',
    mode: EVENT_MODES[0].id,
    registrationUrl: null,
    poster: null,
    published: false,
    recap: '',
    photos: [],
    inTimeline: false,
  };
}

/**
 * Add or edit an event: details, registration and publishing, the poster, and
 * after it ends the recap, photos and the timeline. One schema validates it
 * here, in the Server Action and on every read (rule 3).
 */
export function EventEditor({
  event,
  newId,
}:
  | { event: Event; newId?: never }
  | {
      event: null;
      /** The new event's id, made on the server so uploads can be filed under it. */
      newId: string;
    }) {
  const router = useRouter();
  // "Now" for the timeline hint, fixed when the editor opens; the server
  // decides for real when it saves.
  const [openedAt] = useState(() => new Date());
  const { toast, notify } = useToast();
  const [expectedUpdatedAt, setExpectedUpdatedAt] = useState(event?.updatedAt ?? null);
  const [conflict, setConflict] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const form = useForm<Values, unknown, Saved>({
    resolver: zodResolver(EventInputSchema),
    defaultValues: event ? valuesOf(event) : blankEvent(newId),
  });
  const { control, handleSubmit, formState, setError, reset } = form;
  const { errors, isDirty, isSubmitting } = formState;
  useUnsavedChanges(isDirty);

  const id = form.getValues('id');
  const [title, startsAt, endsAt, photos] = useWatch({
    control,
    name: ['title', 'startsAt', 'endsAt', 'photos'],
  });
  const ended = Boolean(startsAt) && hasEnded({ startsAt, endsAt: endsAt ?? null }, openedAt);
  const canTimeline = ended && (photos?.length ?? 0) > 0;
  const defaultAlt = `Photo from ${title || 'the event'}`;

  const save = handleSubmit(async (values) => {
    setConflict(false);
    const result =
      event && expectedUpdatedAt
        ? await updateEvent(event.id, expectedUpdatedAt, values)
        : await createEvent(values);
    if (!result.ok) {
      setConflict(result.reason === 'conflict');
      reportFailure(result, setError, toast);
      return;
    }
    notify(result, event ? 'Saved. The public pages show it now.' : 'Event created.');
    if (!event) {
      router.replace(`/admin/events/${result.data.id}`);
      return;
    }
    setExpectedUpdatedAt(result.data.updatedAt);
    reset(valuesOf(result.data));
    router.refresh();
  });

  async function remove() {
    if (!event || !expectedUpdatedAt) return;
    const result = await deleteEvent(event.id, expectedUpdatedAt);
    notify(result, 'Event deleted, with its poster and photos.');
    if (result.ok) {
      router.replace('/admin/events');
    } else {
      setConflict(result.reason === 'conflict');
    }
  }

  return (
    <form onSubmit={save} noValidate className="flex flex-col gap-6">
      {conflict ? <ConflictNotice /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>What the event card on /events shows.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <FormField
            id="title"
            label="Title"
            error={errors.title?.message}
            className="md:col-span-2"
          >
            {(field) => <Input {...field} {...inputProps(form, 'title')} maxLength={80} />}
          </FormField>
          <FormField id="category" label="Category" error={errors.category?.message}>
            {(field) => (
              <NativeSelect {...field} {...inputProps(form, 'category')}>
                {CATEGORIES.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </NativeSelect>
            )}
          </FormField>
          <FormField id="mode" label="How people attend" error={errors.mode?.message}>
            {(field) => (
              <NativeSelect {...field} {...inputProps(form, 'mode')}>
                {EVENT_MODES.map((mode) => (
                  <option key={mode.id} value={mode.id}>
                    {mode.label}
                  </option>
                ))}
              </NativeSelect>
            )}
          </FormField>
          <FormField id="startsAt" label="Starts (India time)" error={errors.startsAt?.message}>
            {(field) => (
              <Controller
                control={control}
                name="startsAt"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    {...field}
                    type="datetime-local"
                    value={value ? toClubLocalInput(value) : ''}
                    onChange={(change) =>
                      onChange(change.target.value ? fromClubLocalInput(change.target.value) : '')
                    }
                    onBlur={onBlur}
                  />
                )}
              />
            )}
          </FormField>
          <FormField
            id="endsAt"
            label="Ends (optional)"
            hint="Leave empty for a single-day event: it ends at midnight."
            error={errors.endsAt?.message}
          >
            {(field) => (
              <Controller
                control={control}
                name="endsAt"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    {...field}
                    type="datetime-local"
                    value={value ? toClubLocalInput(value) : ''}
                    onChange={(change) =>
                      onChange(change.target.value ? fromClubLocalInput(change.target.value) : null)
                    }
                    onBlur={onBlur}
                  />
                )}
              />
            )}
          </FormField>
          <FormField
            id="venue"
            label="Venue"
            error={errors.venue?.message}
            className="md:col-span-2"
          >
            {(field) => <Input {...field} {...inputProps(form, 'venue')} maxLength={120} />}
          </FormField>
          <FormField
            id="summary"
            label="Summary"
            hint="One or two sentences, 20–160 characters."
            error={errors.summary?.message}
            className="md:col-span-2"
          >
            {(field) => <Textarea {...field} {...inputProps(form, 'summary')} maxLength={160} />}
          </FormField>
          <FormField
            id="description"
            label="Description (optional)"
            hint="Plain text; leave a blank line between paragraphs. Up to 5,000 characters."
            error={errors.description?.message}
            className="md:col-span-2"
          >
            {(field) => (
              <Textarea {...field} {...inputProps(form, 'description')} rows={6} maxLength={5000} />
            )}
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registration and publishing</CardTitle>
          <CardDescription>
            Registration happens on another site (usually VIERP); the event card links to it.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <FormField
            id="registrationUrl"
            label="Registration link"
            hint="Needed before the event can be published."
            error={errors.registrationUrl?.message}
          >
            {(field) => (
              <Input
                {...field}
                type="url"
                placeholder="https://"
                {...inputProps(form, 'registrationUrl', { setValueAs: blankToNull })}
              />
            )}
          </FormField>
          <label className="flex items-start gap-3 text-body-sm text-foreground">
            <Checkbox {...checkboxProps(form, 'published')} className="mt-0.5" />
            <span>
              Published
              <span className="block text-xs text-muted-foreground">
                Shown on /events until it ends. Unpublished events are drafts.
              </span>
            </span>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Poster</CardTitle>
          <CardDescription>Optional. Any shape: it is shown whole, never cropped.</CardDescription>
        </CardHeader>
        <CardContent>
          <Controller
            control={control}
            name="poster"
            render={({ field }) => (
              <ImageField
                id="poster"
                label="Poster"
                target="event-poster"
                recordId={id}
                value={field.value ?? null}
                onChange={field.onChange}
                defaultAlt={`Poster for ${title || 'the event'}`}
                error={errors.poster}
                frame="aspect-4/5"
              />
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>After the event</CardTitle>
          <CardDescription>
            Once it has ended, add a recap and photos, then put it on the timeline. Its photos then
            appear in the gallery too.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <FormField
            id="recap"
            label="Recap"
            hint="What happened. Up to 2,000 characters."
            error={errors.recap?.message}
          >
            {(field) => (
              <Textarea {...field} {...inputProps(form, 'recap')} rows={5} maxLength={2000} />
            )}
          </FormField>
          <Controller
            control={control}
            name="photos"
            render={({ field }) => (
              <PhotoListField
                id="photos"
                label="Photos"
                target="event-photo"
                recordId={id}
                value={field.value ?? []}
                onChange={field.onChange}
                defaultAlt={defaultAlt}
                max={MAX_EVENT_PHOTOS}
                errors={errors.photos}
              />
            )}
          />
          <label className="flex items-start gap-3 text-body-sm text-foreground">
            <Checkbox
              {...checkboxProps(form, 'inTimeline')}
              disabled={!canTimeline}
              className="mt-0.5"
            />
            <span>
              On the timeline
              <span className="block text-xs text-muted-foreground">
                {canTimeline
                  ? 'Shown in the /events timeline, with its photos in /gallery.'
                  : 'Available once the event has ended and has at least one photo.'}
              </span>
              {errors.inTimeline?.message ? (
                <span className="block text-xs text-destructive">{errors.inTimeline.message}</span>
              ) : null}
            </span>
          </label>
        </CardContent>
      </Card>

      <div className="sticky bottom-0 z-10 -mx-gutter flex flex-wrap items-center gap-3 border-t bg-background px-gutter py-4 lg:-mx-10 lg:px-10">
        <Button type="submit" disabled={isSubmitting || (event !== null && !isDirty)}>
          {isSubmitting ? 'Saving…' : event ? 'Save changes' : 'Create event'}
        </Button>
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {isDirty ? 'Unsaved changes' : event ? 'All changes saved' : ''}
        </p>
        {event ? (
          <Button
            type="button"
            variant="ghost"
            className="ms-auto text-destructive hover:text-destructive"
            onClick={() => setConfirmDelete(true)}
          >
            <Icon icon={Trash2} size="sm" />
            Delete event
          </Button>
        ) : null}
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this event?</AlertDialogTitle>
            <AlertDialogDescription>
              It disappears from the site, and its poster and photos are deleted. This cannot be
              undone.
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
