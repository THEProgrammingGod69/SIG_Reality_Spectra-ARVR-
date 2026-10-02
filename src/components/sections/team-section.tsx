import { Users } from 'lucide-react';

import { EmptyState } from '@/components/ui/empty-state';
import { Heading } from '@/components/ui/heading';
import { Section } from '@/components/ui/section';
import { Text } from '@/components/ui/text';

type TeamSectionProps = {
  /** Heading id; must be unique on the page. */
  id: string;
  title: string;
  lead: string;
};

/**
 * The team section of Home (core team) and About (everyone, by hierarchy).
 *
 * Team members are admin-managed (Redis + Blob, `/admin/team`), which Stage 8
 * builds; until then the section shows its empty state, as every list must
 * (rule 9). Stage 8 passes the members in and renders the cards here.
 */
export function TeamSection({ id, title, lead }: TeamSectionProps) {
  return (
    <Section labelledBy={id}>
      <div className="max-w-prose">
        <Heading level={2} id={id}>
          {title}
        </Heading>
        <Text tone="muted" className="mt-4">
          {lead}
        </Text>
      </div>
      <EmptyState
        icon={Users}
        title="The team is being introduced"
        description="Profiles of the people behind the club will appear here soon."
        className="mt-10"
      />
    </Section>
  );
}
