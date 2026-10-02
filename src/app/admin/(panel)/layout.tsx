import { redirect } from 'next/navigation';
import { type ReactNode, Suspense } from 'react';

import { AdminShell } from '@/components/admin/admin-shell';
import { Skeleton } from '@/components/ui/skeleton';
import { LOGIN_PATH } from '@/lib/auth/policy';
import { getAdminSession } from '@/lib/auth/session';

/**
 * The admin panel. `proxy.ts` already turns signed-out visitors away; this
 * checks again (rule 8) before rendering anything, then wraps the page in the
 * panel's frame.
 */
export default function PanelLayout({ children }: LayoutProps<'/admin'>) {
  return (
    <Suspense fallback={<PanelLoading />}>
      <SignedInPanel>{children}</SignedInPanel>
    </Suspense>
  );
}

async function SignedInPanel({ children }: { children: ReactNode }) {
  const admin = await getAdminSession();
  if (admin === null) redirect(LOGIN_PATH);
  return <AdminShell email={admin.email}>{children}</AdminShell>;
}

function PanelLoading() {
  return (
    <div className="flex min-h-full flex-1 bg-background" aria-busy="true">
      <Skeleton className="hidden h-dvh w-64 rounded-none lg:block" />
      <div className="flex flex-1 flex-col gap-6 px-gutter py-10 lg:px-10">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}
