'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Controller, useForm, useWatch } from 'react-hook-form';
import type { z } from 'zod';

import { ConfirmDelete } from '@/components/admin/confirm-delete';
import { FormField, inputProps } from '@/components/admin/form-field';
import { ConflictNotice, SaveBar, useRecordVersion } from '@/components/admin/form-feedback';
import { ImageField } from '@/components/admin/image-fields';
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
import { blankToNull } from '@/lib/forms';
import { TEAM_TIERS, type TeamMember, TeamMemberInputSchema } from '@/lib/schemas/team';

import { createTeamMember, deleteTeamMember, updateTeamMember } from '../actions';

type Values = z.input<typeof TeamMemberInputSchema>;
type Saved = z.output<typeof TeamMemberInputSchema>;

/** A domain a secretary can lead, from src/content/domains.json. */
export type DomainOption = { id: string; name: string };

/** The form's values for a stored member: its editable fields only. */
function valuesOf(member: TeamMember): Values {
  const { createdAt: _c, updatedAt: _u, updatedBy: _b, ...fields } = member;
  return fields;
}

/**
 * Add or edit a team member (D-027): name, position, tier, the domain a
 * secretary leads, and a photo. One schema validates it here, in the Server
 * Action and on every read (rule 3).
 */
export function MemberEditor({
  member,
  newId,
  domains,
}: (
  | { member: TeamMember; newId?: never }
  | {
      member: null;
      /** The new member's id, made on the server so the photo can be filed under it. */
      newId: string;
    }
) & { domains: readonly DomainOption[] }) {
  const router = useRouter();
  const record = useRecordVersion(member?.updatedAt ?? null);

  const form = useForm<Values, unknown, Saved>({
    resolver: zodResolver(TeamMemberInputSchema),
    defaultValues: member
      ? valuesOf(member)
      : {
          id: newId,
          name: '',
          position: '',
          tier: TEAM_TIERS[0].id,
          domainId: null,
          photo: null,
          order: 0,
        },
  });
  const { control, handleSubmit, formState, setError, setValue, getValues, reset } = form;
  const { errors, isDirty, isSubmitting } = formState;
  useUnsavedChanges(isDirty);

  const id = getValues('id');
  const [name, tier] = useWatch({ control, name: ['name', 'tier'] });

  const save = handleSubmit(async (values) => {
    const result =
      member && record.version
        ? await updateTeamMember(member.id, record.version, values)
        : await createTeamMember(values);
    const saved = record.saved(
      result,
      member ? 'Saved. About shows it now.' : 'Member added to the team.',
      setError,
    );
    if (!saved) return;
    if (!member) {
      router.replace(`/admin/team/${saved.id}`);
      return;
    }
    reset(valuesOf(saved));
    router.refresh();
  });

  async function remove() {
    if (!member || !record.version) return;
    const result = await deleteTeamMember(member.id, record.version);
    if (record.deleted(result, 'Member removed from the team, with their photo.')) {
      router.replace('/admin/team');
    }
  }

  return (
    <form onSubmit={save} noValidate className="flex flex-col gap-6">
      {record.conflict ? <ConflictNotice /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>What their card on the About page shows.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <FormField id="name" label="Name" error={errors.name?.message}>
            {(field) => <Input {...field} {...inputProps(form, 'name')} maxLength={60} />}
          </FormField>
          <FormField id="tier" label="Part of" error={errors.tier?.message}>
            {(field) => (
              <NativeSelect
                {...field}
                {...inputProps(form, 'tier', {
                  // Only secretaries lead a domain.
                  onChange: (event: { target: { value: string } }) => {
                    if (event.target.value !== 'secretary') setValue('domainId', null);
                  },
                })}
              >
                {TEAM_TIERS.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.label}
                  </option>
                ))}
              </NativeSelect>
            )}
          </FormField>
          {tier === 'secretary' ? (
            <FormField id="domainId" label="Domain they lead" error={errors.domainId?.message}>
              {(field) => (
                <NativeSelect
                  {...field}
                  {...inputProps(form, 'domainId', {
                    setValueAs: blankToNull,
                    // Suggest the usual position for a new secretary.
                    onChange: (event: { target: { value: string } }) => {
                      const domain = domains.find((entry) => entry.id === event.target.value);
                      if (domain && !getValues('position').trim()) {
                        setValue('position', `Secretary, ${domain.name}`, { shouldDirty: true });
                      }
                    },
                  })}
                >
                  <option value="">Choose the domain</option>
                  {domains.map((domain) => (
                    <option key={domain.id} value={domain.id}>
                      {domain.name}
                    </option>
                  ))}
                </NativeSelect>
              )}
            </FormField>
          ) : null}
          <FormField
            id="position"
            label="Position"
            hint={
              tier === 'secretary'
                ? 'e.g. Secretary, XR Development'
                : 'e.g. President, Vice President, Treasurer'
            }
            error={errors.position?.message}
            className={tier === 'secretary' ? undefined : 'md:col-span-2'}
          >
            {(field) => <Input {...field} {...inputProps(form, 'position')} maxLength={60} />}
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Photo</CardTitle>
          <CardDescription>Optional. Without one, the card shows their initials.</CardDescription>
        </CardHeader>
        <CardContent>
          <Controller
            control={control}
            name="photo"
            render={({ field }) => (
              <ImageField
                id="photo"
                label="Photo"
                target="member-photo"
                recordId={id}
                value={field.value ?? null}
                onChange={field.onChange}
                defaultAlt={`Photo of ${name || 'the team member'}`}
                error={errors.photo}
                frame="aspect-square"
                hint="A clear head-and-shoulders photo. It is cropped to a square from the centre."
              />
            )}
          />
        </CardContent>
      </Card>

      <SaveBar
        exists={member !== null}
        createLabel="Add member"
        isDirty={isDirty}
        isSubmitting={isSubmitting}
      >
        {member ? (
          <ConfirmDelete
            label="Remove member"
            title="Remove this member?"
            description="They disappear from the About page, and their photo is deleted. This cannot be undone."
            onConfirm={remove}
          />
        ) : null}
      </SaveBar>
    </form>
  );
}
