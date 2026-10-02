'use client';

import {
  CalendarDays,
  ExternalLink,
  Handshake,
  Images,
  LayoutDashboard,
  LogOut,
  type LucideIcon,
  Menu,
  UserPlus,
  Users,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button } from '@/components/admin/ui/button';
import { Separator } from '@/components/admin/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/admin/ui/sheet';
import { Icon } from '@/components/ui/icon';
import { BrandMark } from '@/components/ui/logo';
import { signOutAdmin } from '@/lib/auth/actions';
import { cn } from '@/lib/cn';
import { type AdminRouteHref, adminRoutes, siteConfig } from '@/lib/site';

import { GuardedLink, useLeaveGuard } from './unsaved-changes';

/**
 * The panel's navigation, account and sign-out — one component, shown as the
 * sidebar from `lg` up and inside a sheet on smaller screens.
 */

const ICONS: Record<AdminRouteHref, LucideIcon> = {
  '/admin': LayoutDashboard,
  '/admin/events': CalendarDays,
  '/admin/gallery': Images,
  '/admin/team': Users,
  '/admin/recruitment': UserPlus,
  '/admin/sponsorships': Handshake,
};

function isCurrent(pathname: string, href: AdminRouteHref): boolean {
  return href === '/admin' ? pathname === href : pathname.startsWith(href);
}

function NavigationContent({ email, onNavigate }: { email: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  const confirmLeave = useLeaveGuard();
  const [signingOut, startSignOut] = useTransition();

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="flex items-center gap-3 px-2">
        <BrandMark className="size-9" />
        <div className="min-w-0">
          <p className="font-display text-body-sm font-medium text-foreground">Admin</p>
          <p className="truncate text-xs text-muted-foreground">{siteConfig.name}</p>
        </div>
      </div>

      <nav aria-label="Admin">
        <ul className="flex flex-col gap-1">
          {adminRoutes.map((route) => {
            const current = isCurrent(pathname, route.href);
            return (
              <li key={route.href}>
                <GuardedLink
                  href={route.href}
                  aria-current={current ? 'page' : undefined}
                  onClick={onNavigate}
                  className={cn(
                    'flex items-center gap-3 rounded-control px-3 py-2 text-body-sm text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                    current && 'bg-secondary font-medium text-foreground',
                  )}
                >
                  <Icon icon={ICONS[route.href]} size="sm" />
                  {route.label}
                </GuardedLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        <Separator />
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 text-body-sm text-muted-foreground hover:text-foreground"
        >
          <Icon icon={ExternalLink} size="sm" />
          View the live site
          <span className="sr-only">(opens in a new tab)</span>
        </a>
        <div className="px-3">
          <p className="text-xs text-muted-foreground">Signed in as</p>
          <p className="truncate text-body-sm text-foreground" title={email}>
            {email}
          </p>
        </div>
        <Button
          variant="outline"
          disabled={signingOut}
          onClick={() => {
            const leave = () => startSignOut(() => signOutAdmin());
            if (confirmLeave(leave)) leave();
          }}
        >
          <Icon icon={LogOut} size="sm" />
          {signingOut ? 'Signing out…' : 'Sign out'}
        </Button>
      </div>
    </div>
  );
}

/** The sidebar, from `lg` up. */
export function AdminSidebar({ email }: { email: string }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r bg-card lg:block">
      <NavigationContent email={email} />
    </aside>
  );
}

/** The top bar with a menu button, below `lg`. */
export function AdminTopBar({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4 lg:hidden">
      <div className="flex items-center gap-2">
        <BrandMark className="size-8" />
        <span className="font-display text-body-sm font-medium text-foreground">Admin</span>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Open the admin menu">
            <Icon icon={Menu} size="md" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Admin menu</SheetTitle>
          <SheetDescription className="sr-only">Pages of the admin panel</SheetDescription>
          <NavigationContent email={email} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </header>
  );
}
