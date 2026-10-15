import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AdminPageHeader } from '@/components/admin/admin-page';
import { DataUnavailable } from '@/components/admin/data-unavailable';
import { Button } from '@/components/admin/ui/button';
import { GuardedLink } from '@/components/admin/unsaved-changes';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { adminRead } from '@/lib/data';

import { RequestItem } from './_components/request-item';

export const metadata: Metadata = { title: 'Sponsorships' };

/** Requests per page of the inbox. */
const PAGE_SIZE = 20;

export default function AdminSponsorshipsPage({ searchParams }: PageProps<'/admin/sponsorships'>) {
  return (
    <>
      <AdminPageHeader href="/admin/sponsorships" />
      <Suspense fallback={<Skeleton className="h-96 rounded-card" />}>
        <Requests searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Requests({ searchParams }: Pick<PageProps<'/admin/sponsorships'>, 'searchParams'>) {
  const { page: pageParam } = await searchParams;
  const requested = Number(typeof pageParam === 'string' ? pageParam : 1);
  const page = Number.isInteger(requested) && requested > 0 ? requested : 1;

  const read = await adminRead('the sponsorship requests', async ({ sponsorships }) => {
    const [total, requests] = await Promise.all([
      sponsorships.count(),
      sponsorships.list({ offset: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE }),
    ]);
    return { total, requests };
  });
  if ('unavailable' in read) return <DataUnavailable reason={read.unavailable} />;

  const { total, requests } = read.data;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (total === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="No requests yet"
        description="Requests sent from the sponsorship form on the Contact page arrive here."
      />
    );
  }

  return (
    <section aria-label="Requests" className="flex flex-col gap-4">
      <p className="text-body-sm text-muted-foreground">
        {total} {total === 1 ? 'request' : 'requests'}, newest first. New ones open by default.
      </p>
      {requests.length === 0 ? (
        // A page past the end: an old link, or requests deleted meanwhile.
        <EmptyState
          title="Nothing on this page"
          description={`The inbox has ${pages} ${pages === 1 ? 'page' : 'pages'}.`}
          action={
            <Button variant="outline" asChild>
              <GuardedLink href="/admin/sponsorships">
                <Icon icon={ChevronLeft} size="sm" />
                Back to the first page
              </GuardedLink>
            </Button>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {requests.map((request) => (
            <li key={request.id}>
              <RequestItem request={request} />
            </li>
          ))}
        </ul>
      )}
      {pages > 1 ? (
        <nav aria-label="Pages" className="flex items-center justify-between gap-3">
          {page > 1 ? (
            <Button variant="outline" size="sm" asChild>
              <GuardedLink href={`/admin/sponsorships?page=${page - 1}`}>
                <Icon icon={ChevronLeft} size="sm" />
                Newer
              </GuardedLink>
            </Button>
          ) : (
            <span />
          )}
          <p className="text-xs text-muted-foreground">
            Page {Math.min(page, pages)} of {pages}
          </p>
          {page < pages ? (
            <Button variant="outline" size="sm" asChild>
              <GuardedLink href={`/admin/sponsorships?page=${page + 1}`}>
                Older
                <Icon icon={ChevronRight} size="sm" />
              </GuardedLink>
            </Button>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </section>
  );
}
