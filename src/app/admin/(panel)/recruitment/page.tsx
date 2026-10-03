import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AdminPageHeader } from '@/components/admin/admin-page';
import { DataUnavailable } from '@/components/admin/data-unavailable';
import { Skeleton } from '@/components/ui/skeleton';
import { adminRead } from '@/lib/data';
import { formatDateTime } from '@/lib/dates';

import { RecruitmentForm } from './_components/recruitment-form';

export const metadata: Metadata = { title: 'Recruitment' };

export default function AdminRecruitmentPage() {
  return (
    <Suspense
      fallback={
        <>
          <AdminPageHeader href="/admin/recruitment" />
          <Skeleton className="h-96 rounded-card" />
        </>
      }
    >
      <Recruitment />
    </Suspense>
  );
}

async function Recruitment() {
  const read = await adminRead('the recruitment settings', ({ recruitment }) => recruitment.get());
  if ('unavailable' in read) {
    return (
      <>
        <AdminPageHeader href="/admin/recruitment" />
        <DataUnavailable reason={read.unavailable} />
      </>
    );
  }
  const settings = read.data;
  return (
    <>
      <AdminPageHeader
        href="/admin/recruitment"
        description={
          settings
            ? `Last saved ${formatDateTime(settings.updatedAt)}${settings.updatedBy ? ` by ${settings.updatedBy}` : ''}.`
            : 'Never saved: the site shows recruitment as closed until you save.'
        }
      />
      <RecruitmentForm settings={settings} />
    </>
  );
}
