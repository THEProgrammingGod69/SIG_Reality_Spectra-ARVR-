import { Badge } from '@/components/admin/ui/badge';
import type { EventPhase } from '@/lib/schemas/event';

/** How the panel names each event phase (src/lib/schemas/event.ts). */
export const PHASE_LABELS = {
  current: { label: 'Published', variant: 'success' },
  draft: { label: 'Draft', variant: 'outline' },
  awaiting: { label: 'Needs recap', variant: 'warning' },
  timeline: { label: 'On the timeline', variant: 'secondary' },
} as const satisfies Record<EventPhase, { label: string; variant: string }>;

export function EventPhaseBadge({ phase }: { phase: EventPhase }) {
  const { label, variant } = PHASE_LABELS[phase];
  return <Badge variant={variant}>{label}</Badge>;
}
