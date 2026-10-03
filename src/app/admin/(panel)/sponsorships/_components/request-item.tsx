'use client';

import { ChevronDown, Mail, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ConfirmDelete } from '@/components/admin/confirm-delete';
import { FormField } from '@/components/admin/form-field';
import { ConflictNotice, useRecordVersion } from '@/components/admin/form-feedback';
import { Badge } from '@/components/admin/ui/badge';
import { NativeSelect } from '@/components/admin/ui/native-select';
import { Icon } from '@/components/ui/icon';
import { formatDateTime } from '@/lib/dates';
import {
  SPONSORSHIP_STATUSES,
  SPONSORSHIP_TYPES,
  type SponsorshipRequest,
  type SponsorshipStatus,
} from '@/lib/schemas/sponsorship';

import { deleteSponsorship, setSponsorshipStatus } from '../actions';

const STATUS_BADGE = {
  new: 'default',
  contacted: 'outline',
  closed: 'secondary',
} as const satisfies Record<SponsorshipStatus, string>;

const labelOf = <T extends { id: string; label: string }>(list: readonly T[], id: string) =>
  list.find((entry) => entry.id === id)?.label ?? id;

/**
 * One request in the inbox: who, what and when at a glance; open it for the
 * message, the contact details, the status and delete. A status change saves
 * at once.
 */
export function RequestItem({ request }: { request: SponsorshipRequest }) {
  const router = useRouter();
  const record = useRecordVersion(request.updatedAt);
  const [status, setStatus] = useState(request.status);
  const [saving, setSaving] = useState(false);
  // A stored request always has a version; the fallback only satisfies the type.
  const version = record.version ?? request.updatedAt;

  async function changeStatus(next: SponsorshipStatus) {
    setStatus(next);
    setSaving(true);
    const saved = record.saved(
      await setSponsorshipStatus(request.id, version, next),
      `Marked as ${labelOf(SPONSORSHIP_STATUSES, next).toLowerCase()}.`,
    );
    setSaving(false);
    if (saved) router.refresh();
    else setStatus(status);
  }

  async function remove() {
    if (record.deleted(await deleteSponsorship(request.id, version), 'Request deleted.')) {
      router.refresh();
    }
  }

  return (
    <details className="group rounded-card border bg-background" open={request.status === 'new'}>
      <summary className="flex cursor-pointer list-none flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4 [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="line-clamp-1 text-body-sm font-medium wrap-anywhere text-foreground">
            {request.organisation}
          </span>
          <span className="line-clamp-1 text-xs wrap-anywhere text-muted-foreground">
            {request.name} · {labelOf(SPONSORSHIP_TYPES, request.type)} · received{' '}
            {formatDateTime(request.createdAt)}
          </span>
        </span>
        <span className="flex items-center gap-2">
          <Badge variant={STATUS_BADGE[status]}>{labelOf(SPONSORSHIP_STATUSES, status)}</Badge>
          <Icon
            icon={ChevronDown}
            size="sm"
            className="text-muted-foreground group-open:rotate-180"
          />
        </span>
      </summary>

      <div className="flex flex-col gap-5 border-t p-4">
        {record.conflict ? <ConflictNotice /> : null}
        <p className="text-body-sm wrap-anywhere whitespace-pre-line text-foreground">
          {request.message}
        </p>
        <ul className="flex flex-col gap-2 text-body-sm">
          <li className="flex items-center gap-2">
            <Icon icon={Mail} size="sm" className="text-muted-foreground" />
            <a
              href={`mailto:${request.email}`}
              className="break-all text-foreground underline-offset-4 hover:underline"
            >
              {request.email}
            </a>
          </li>
          {request.phone ? (
            <li className="flex items-center gap-2">
              <Icon icon={Phone} size="sm" className="text-muted-foreground" />
              <a
                href={`tel:${request.phone.replace(/[^+0-9]/g, '')}`}
                className="text-foreground underline-offset-4 hover:underline"
              >
                {request.phone}
              </a>
            </li>
          ) : null}
        </ul>
        <div className="flex flex-wrap items-end gap-3">
          <FormField id={`status-${request.id}`} label="Status" className="w-48">
            {(control) => (
              <NativeSelect
                {...control}
                value={status}
                disabled={saving}
                onChange={(event) => void changeStatus(event.target.value as SponsorshipStatus)}
              >
                {SPONSORSHIP_STATUSES.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.label}
                  </option>
                ))}
              </NativeSelect>
            )}
          </FormField>
          {request.updatedBy ? (
            <p className="text-xs text-muted-foreground">
              Last changed by {request.updatedBy}, {formatDateTime(request.updatedAt)}
            </p>
          ) : null}
          <ConfirmDelete
            label="Delete"
            size="sm"
            className="ms-auto"
            title="Delete this request?"
            description="It is removed from the inbox for every admin. This cannot be undone."
            onConfirm={remove}
          />
        </div>
      </div>
    </details>
  );
}
