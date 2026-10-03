import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { AdminPageHeader } from '@/components/admin/admin-page';
import { DataUnavailable } from '@/components/admin/data-unavailable';
import { Skeleton } from '@/components/ui/skeleton';
import { domainOptions } from '@/lib/content';
import { dataAvailability } from '@/lib/data';

import { MemberEditor } from '../_components/member-editor';

export const metadata: Metadata = { title: 'Add team member' };

export default function NewMemberPage() {
  return (
    <>
      <AdminPageHeader
        href="/admin/team"
        back
        title="Add team member"
        description="A core team office-bearer, or the secretary of a domain. They join the end of their group."
      />
      <Suspense fallback={<Skeleton className="h-96 rounded-card" />}>
        <NewMember />
      </Suspense>
    </>
  );
}

async function NewMember() {
  if (!dataAvailability().records) return <DataUnavailable reason="not-configured" />;
  // A fresh id per visit, so the photo can be filed under the member before they are saved.
  await connection();
  return <MemberEditor member={null} newId={crypto.randomUUID()} domains={domainOptions} />;
}
