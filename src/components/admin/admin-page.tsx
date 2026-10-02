import { Hammer } from 'lucide-react';
import type { ReactNode } from 'react';

import { EmptyState } from '@/components/ui/empty-state';
import { type AdminRouteHref, getAdminRoute } from '@/lib/site';

/**
 * The heading every admin page starts with. Title and description come from
 * `adminRoutes` in src/lib/site.ts, the same list the navigation uses.
 */
export function AdminPageHeader({ href, actions }: { href: AdminRouteHref; actions?: ReactNode }) {
  const route = getAdminRoute(href);
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex max-w-prose flex-col gap-2">
        <h1 className="text-display-md">{route.label}</h1>
        <p className="text-body-sm text-muted-foreground">{route.description}</p>
      </div>
      {actions}
    </header>
  );
}

/** An admin tool whose screens a later stage builds. */
export function PlannedTool({ href, stage }: { href: AdminRouteHref; stage: number }) {
  return (
    <>
      <AdminPageHeader href={href} />
      <EmptyState
        icon={Hammer}
        title={`Built in Stage ${stage}`}
        description="This tool is not built yet. Its data layer is ready; the editing screens come next."
      />
    </>
  );
}
