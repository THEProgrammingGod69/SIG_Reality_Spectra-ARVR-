import type { ReactNode } from 'react';

import { AdminSidebar, AdminTopBar } from './admin-navigation';
import { ToastProvider } from './toaster';
import { UnsavedChangesProvider } from './unsaved-changes';

/**
 * The admin panel's frame (D-030): sidebar (or top bar and menu on small
 * screens), the page, notifications and the unsaved-changes guard. Rendered
 * only for a signed-in admin, by `src/app/admin/(panel)/layout.tsx`.
 */
export function AdminShell({ email, children }: { email: string; children: ReactNode }) {
  return (
    <ToastProvider>
      <UnsavedChangesProvider>
        <div className="flex min-h-full flex-1 bg-background">
          <AdminSidebar email={email} />
          <div className="flex min-w-0 flex-1 flex-col">
            <AdminTopBar email={email} />
            <main id="main-content" className="flex-1 px-gutter py-8 lg:px-10 lg:py-10">
              <div className="mx-auto flex max-w-content flex-col gap-8">{children}</div>
            </main>
          </div>
        </div>
      </UnsavedChangesProvider>
    </ToastProvider>
  );
}
