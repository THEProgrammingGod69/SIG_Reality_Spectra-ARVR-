'use client';

import { TriangleAlert } from 'lucide-react';
import { useEffect } from 'react';

import { Button } from '@/components/admin/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

/**
 * A page of the panel failed to render (an outage, or a bug). The frame and
 * navigation stay, so the admin can retry or go elsewhere.
 */
export default function PanelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <EmptyState
      icon={TriangleAlert}
      title="This page could not be loaded"
      description="Something went wrong while loading it. Nothing was changed. Try again; if it keeps happening, note the time and tell the site maintainer."
      action={<Button onClick={reset}>Try again</Button>}
    />
  );
}
