import { Marquee } from '@/components/motion/marquee';
import type { DomainGroup } from '@/lib/content';

/** The spectrum diamond between names. */
function Spark() {
  return <span className="size-2 shrink-0 rotate-45 bg-(image:--gradient-spectra)" />;
}

/**
 * Home: the club's domains as kinetic type (D-037) — a band of two marquees
 * between the statement and the cards, the technical domains in hollow
 * display type running one way and the non-technical ones in solid type the
 * other. It sets the scale of the club before the list spells it out.
 *
 * Decorative: `Marquee` hides it from assistive technology, because the
 * domain overview right below lists every domain as real, linked text.
 */
export function DomainTicker({ groups }: { groups: readonly DomainGroup[] }) {
  const [first, ...rest] = groups;
  const lead = first?.domains ?? [];
  const follow = rest.flatMap((group) => group.domains);

  return (
    <div className="flex flex-col gap-4 border-y border-(--color-border) py-10 md:gap-6 md:py-14">
      <Marquee
        items={lead.map((domain) => (
          <span
            key={domain.id}
            className="font-display text-display-xl whitespace-nowrap text-outline"
          >
            {domain.name}
          </span>
        ))}
        separator={<Spark />}
      />
      <Marquee
        reverse
        spacing="md"
        items={follow.map((domain) => (
          <span
            key={domain.id}
            className="font-display text-display-md whitespace-nowrap text-(--color-muted)"
          >
            {domain.name}
          </span>
        ))}
        separator={<Spark />}
      />
    </div>
  );
}
