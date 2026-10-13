import { Section } from '@/components/ui/section';
import { WhoWeAreContent } from '@/components/sections/who-we-are-content';

/**
 * Home: "who we are", the first section after the hero. It opens under the
 * horizon glow — the board's light rising from the floor — so the hero's
 * scroll-out hands over into light that continues, not into a hard edge
 * (completes D-018).
 */
export function AboutIntro() {
  return (
    <Section labelledBy="about-intro" className="relative isolate overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[min(36rem,80svh)] bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,color-mix(in_oklab,var(--color-spectra-violet)_22%,transparent),transparent_70%)]"
      />
      <WhoWeAreContent />
    </Section>
  );
}
