import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { AdminPageHeader } from '@/components/admin/admin-page';
import { DataUnavailable } from '@/components/admin/data-unavailable';
import { Skeleton } from '@/components/ui/skeleton';
import { domainOptions } from '@/lib/content';
import { adminRead } from '@/lib/data';
import { formatDateTime } from '@/lib/dates';
import { TEAM_TIERS } from '@/lib/schemas/team';

import { MemberEditor } from '../_components/member-editor';

export const metadata: Metadata = { title: 'Edit team member' };

export default function EditMemberPage({ params }: PageProps<'/admin/team/[id]'>) {
  return (
    <Suspense fallback={<Skeleton className="h-96 rounded-card" />}>
      <EditMember params={params} />
    </Suspense>
  );
}

async function EditMember({ params }: Pick<PageProps<'/admin/team/[id]'>, 'params'>) {
  const { id } = await params;
  const read = await adminRead('a team member', ({ team }) => team.get(id));
  if ('unavailable' in read) {
    return (
      <>
        <AdminPageHeader href="/admin/team" back title="Edit team member" />
        <DataUnavailable reason={read.unavailable} />
      </>
    );
  }
  const member = read.data;
  if (member === null) notFound();
  const tier = TEAM_TIERS.find((entry) => entry.id === member.tier)?.label;

  return (
    <>
      <AdminPageHeader
        href="/admin/team"
        back
        title={member.name}
        description={`${tier} · last saved ${formatDateTime(member.updatedAt)}${member.updatedBy ? ` by ${member.updatedBy}` : ''}`}
      />
      <MemberEditor member={member} domains={domainOptions} />
    </>
  );
}
