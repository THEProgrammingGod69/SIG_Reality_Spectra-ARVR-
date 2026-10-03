'use client';

import { ArrowDown, ArrowUp } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ConflictNotice } from '@/components/admin/form-feedback';
import { useToast } from '@/components/admin/toaster';
import { Button } from '@/components/admin/ui/button';
import { GuardedLink } from '@/components/admin/unsaved-changes';
import { Icon } from '@/components/ui/icon';
import { initialsOf, type TeamMember } from '@/lib/schemas/team';

import { reorderTeam } from '../actions';

/** One member in an admin list, linking to their editor. */
function MemberRow({ member, detail }: { member: TeamMember; detail: string }) {
  return (
    <GuardedLink
      href={`/admin/team/${member.id}`}
      className="flex min-w-0 flex-1 items-center gap-4 rounded-control p-2 hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-xs font-medium text-muted-foreground">
        {member.photo ? (
          <Image src={member.photo.url} alt="" fill sizes="2.5rem" className="object-cover" />
        ) : (
          <span aria-hidden="true">{initialsOf(member.name)}</span>
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="line-clamp-1 text-body-sm font-medium wrap-anywhere text-foreground">
          {member.name}
        </span>
        <span className="line-clamp-1 text-xs wrap-anywhere text-muted-foreground">{detail}</span>
      </span>
    </GuardedLink>
  );
}

/**
 * The core team in the order About shows it, with up/down buttons. Each move
 * saves the whole order at once (all members, or none), so two admins
 * reordering at the same time cannot interleave.
 */
export function CoreTeamList({ members }: { members: readonly TeamMember[] }) {
  const router = useRouter();
  const { notify } = useToast();
  // Shown at once; the page's fresh data replaces it after the save.
  const [order, setOrder] = useState(members);
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState(false);

  if (order.length === 0) {
    return <p className="text-body-sm text-muted-foreground">No core team members yet.</p>;
  }

  async function move(index: number, by: -1 | 1) {
    const next = [...order];
    const [moved] = next.splice(index, 1);
    next.splice(index + by, 0, moved!);
    setOrder(next);
    setSaving(true);
    const result = await reorderTeam(
      next.map((member) => ({ id: member.id, expectedUpdatedAt: member.updatedAt })),
    );
    setSaving(false);
    notify(result, 'Order saved. About shows it now.');
    setConflict(!result.ok && result.reason === 'conflict');
    if (result.ok) router.refresh();
    else setOrder(order);
  }

  return (
    <>
      {conflict ? <ConflictNotice /> : null}
      <ol className="flex flex-col gap-1" aria-busy={saving}>
        {order.map((member, index) => (
          <li key={member.id} className="flex items-center gap-1">
            <MemberRow member={member} detail={member.position} />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Move ${member.name} up`}
              disabled={saving || index === 0}
              onClick={() => void move(index, -1)}
            >
              <Icon icon={ArrowUp} size="sm" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Move ${member.name} down`}
              disabled={saving || index === order.length - 1}
              onClick={() => void move(index, 1)}
            >
              <Icon icon={ArrowDown} size="sm" />
            </Button>
          </li>
        ))}
      </ol>
    </>
  );
}

/** The domain secretaries, in domain order (as About lists them). */
export function SecretaryList({
  members,
  domainNames,
}: {
  members: readonly TeamMember[];
  domainNames: Readonly<Record<string, string>>;
}) {
  if (members.length === 0) {
    return <p className="text-body-sm text-muted-foreground">No domain secretaries yet.</p>;
  }
  return (
    <ul className="flex flex-col gap-1">
      {members.map((member) => {
        const domain = (member.domainId && domainNames[member.domainId]) || 'No domain';
        // "Secretary, XR Development" already names its domain.
        const detail = member.position.includes(domain)
          ? member.position
          : `${member.position} · ${domain}`;
        return (
          <li key={member.id} className="flex">
            <MemberRow member={member} detail={detail} />
          </li>
        );
      })}
    </ul>
  );
}
