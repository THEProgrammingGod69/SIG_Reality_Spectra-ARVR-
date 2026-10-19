import { ArrowLeft, SearchX } from 'lucide-react';

import { AdminPageHeader } from '@/components/admin/admin-page';
import { Button } from '@/components/admin/ui/button';
import { GuardedLink } from '@/components/admin/unsaved-changes';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';

/**
 * A panel page asked for a record that does not exist — an old link, or one
 * another admin has deleted (`notFound()` in an editor). It renders inside the
 * panel's frame, navigation and all, instead of the public site's 404.
 */
export default function PanelNotFound() {
  return (
    <>
      <AdminPageHeader
        href="/admin"
        title="Not found"
        description="That record does not exist. It may have been deleted, or the link is out of date."
      />
      <EmptyState
        icon={SearchX}
        title="Nothing to edit here"
        description="Pick it again from its list: the events, gallery and team tools list everything that exists."
        action={
          <Button variant="outline" asChild>
            <GuardedLink href="/admin">
              <Icon icon={ArrowLeft} size="sm" />
              Back to the dashboard
            </GuardedLink>
          </Button>
        }
      />
    </>
  );
}
