'use client';

import { GalleryHorizontalEnd } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useToast } from '@/components/admin/toaster';
import { Button } from '@/components/admin/ui/button';
import { Icon } from '@/components/ui/icon';

import { putOnTimeline } from '../actions';

/**
 * "Put on timeline" beside an ended event, so the step after an event is one
 * click; the recap and photos can follow in the editor whenever they are ready.
 */
export function TimelineButton({
  id,
  version,
  title,
}: {
  id: string;
  version: string;
  title: string;
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [saving, setSaving] = useState(false);

  async function put() {
    setSaving(true);
    const result = await putOnTimeline(id, version);
    setSaving(false);
    notify(result, 'On the timeline. /events and /gallery show it now.');
    if (result.ok) router.refresh();
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={saving}
      onClick={put}
      aria-label={`Put ${title} on the timeline`}
    >
      <Icon icon={GalleryHorizontalEnd} size="sm" />
      Put on timeline
    </Button>
  );
}
