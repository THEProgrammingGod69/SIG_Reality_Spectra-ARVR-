import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AdminPageHeader } from '@/components/admin/admin-page';

import { Overview, OverviewLoading } from './_components/overview';
import { SetupChecklist } from './_components/setup-checklist';

export const metadata: Metadata = { title: 'Dashboard' };

export default function DashboardPage() {
  return (
    <>
      <AdminPageHeader href="/admin" />
      <Suspense fallback={<OverviewLoading />}>
        <Overview />
      </Suspense>
      <SetupChecklist />
    </>
  );
}
