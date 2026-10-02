import { SmoothScroll } from '@/components/motion/smooth-scroll';
import { RecruitmentBanner } from '@/components/site/recruitment-banner';
import { SiteFooter } from '@/components/site/site-footer';
import { SiteHeader } from '@/components/site/site-header';
import { interimRecruitment, siteChannels } from '@/lib/content';

/**
 * Public site shell (Stage 3): skip link, recruitment banner slot, fixed
 * header, the single <main> landmark and the footer. Navigation is driven by
 * `siteRoutes` (src/lib/site.ts) — never hardcoded here.
 *
 * The header is fixed and overlays the page, so <main> is padded by the
 * header height — except when the page opens with a full-bleed section
 * (`data-full-bleed`, the home hero), which runs underneath the header.
 *
 * Lenis (`SmoothScroll`) runs on the public site only; the admin panel keeps
 * native scrolling. Content reaches the (client) header as plain props.
 */
export default function SiteLayout({ children }: LayoutProps<'/'>) {
  return (
    <>
      <SmoothScroll />

      <a
        href="#main-content"
        data-skip-link
        className="sr-only z-(--z-skip) rounded-full bg-(--color-accent) px-4 py-2 text-body-sm font-medium text-(--color-accent-contrast) focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Skip to content
      </a>

      <RecruitmentBanner />
      <SiteHeader channels={siteChannels} recruitmentOpen={interimRecruitment.open} />

      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 scroll-mt-header focus:outline-none [&:not(:has([data-full-bleed]))]:pt-header"
      >
        {children}
      </main>

      <SiteFooter />
    </>
  );
}
