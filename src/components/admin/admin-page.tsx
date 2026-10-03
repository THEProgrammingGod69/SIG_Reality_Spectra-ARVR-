import { ArrowLeft, Hammer } from 'lucide-react';
import type { ReactNode } from 'react';

import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { type AdminRouteHref, getAdminRoute } from '@/lib/site';

import { GuardedLink } from './unsaved-changes';

type AdminPageHeaderProps = {
  /** The tool this page belongs to: its title and description by default. */
  href: AdminRouteHref;
  /** For a page inside a tool, e.g. one event's editor. */
  title?: string;
  description?: string;
  /** Show a link back to the tool's main page. */
  back?: boolean;
  actions?: ReactNode;
};

/**
 * The heading every admin page starts with. Title and description come from
 * `adminRoutes` in src/lib/site.ts, the same list the navigation uses, unless
 * the page names itself.
 */
export function AdminPageHeader({ href, title, description, back, actions }: AdminPageHeaderProps) {
  const route = getAdminRoute(href);
  return (
    <header className="flex flex-col gap-4">
      {back ? (
        <GuardedLink
          href={href}
          className="flex items-center gap-1 self-start text-body-sm text-muted-foreground hover:text-foreground"
        >
          <Icon icon={ArrowLeft} size="sm" />
          {route.label}
        </GuardedLink>
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex max-w-prose min-w-0 flex-col gap-2">
          <h1 className="text-display-md wrap-anywhere">{title ?? route.label}</h1>
          <p className="text-body-sm text-muted-foreground">{description ?? route.description}</p>
        </div>
        {actions}
      </div>
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
