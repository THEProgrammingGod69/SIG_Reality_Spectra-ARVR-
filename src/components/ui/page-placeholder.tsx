/**
 * TEMPORARY — Stage 1 only.
 *
 * Every sitemap route renders this so the routing tree is real and testable
 * before any design exists. Stage 3 introduces the design system and Stage 4
 * replaces each of these with actual page content. When the last placeholder
 * is gone, delete this file.
 */

type PagePlaceholderProps = {
  /** Page name, rendered as the single <h1>. */
  title: string;
  /** One line describing what this page will hold. */
  description: string;
  /** Which stage fills this page in, so the placeholder explains itself. */
  filledInStage: number;
};

export function PagePlaceholder({ title, description, filledInStage }: PagePlaceholderProps) {
  return (
    <section
      data-testid="page-placeholder"
      className="mx-auto w-full max-w-3xl px-6 py-24 sm:py-32"
    >
      <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h1>
      <p className="mt-4 text-base text-pretty text-(--color-muted)">{description}</p>
      <p className="mt-10 inline-flex rounded-full border border-(--color-border) bg-(--color-surface) px-4 py-1.5 font-mono text-xs text-(--color-muted)">
        Placeholder — built in Stage {filledInStage}
      </p>
    </section>
  );
}
