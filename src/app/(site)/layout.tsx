import { SmoothScroll } from '@/components/motion/smooth-scroll';
import { FilmGrain } from '@/components/site/film-grain';
import { SiteFooter } from '@/components/site/site-footer';
import { SiteHeader } from '@/components/site/site-header';
import { WebAnalytics } from '@/components/site/web-analytics';
import { siteChannels } from '@/lib/content';
import { getRecruitment, publicRead } from '@/lib/data';

/**
 * Public site shell (Stage 3): skip link, fixed header, the single <main>
 * landmark and the footer. Navigation is driven by `siteRoutes`
 * (src/lib/site.ts) — never hardcoded here.
 *
 * The header is fixed and overlays the page, so <main> is padded by the
 * header height — except when the page opens with a full-bleed section
 * (`data-full-bleed`, the home hero), which runs underneath the header.
 *
 * Lenis (`SmoothScroll`) runs on the public site only; the admin panel keeps
 * native scrolling. Content reaches the (client) header as plain props: the
 * contact channels, and whether recruitment is open — the cached admin
 * setting (`recruitment` tag), so a save in /admin/recruitment updates the
 * header on every page at once. If it cannot be read, the header shows
 * recruitment as closed rather than failing the page.
 */
export default async function SiteLayout({ children }: LayoutProps<'/'>) {
  const recruitment = await publicRead('the recruitment status', getRecruitment);
  const recruitmentOpen = 'data' in recruitment && recruitment.data.open;

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

      <SiteHeader channels={siteChannels} recruitmentOpen={recruitmentOpen} />

      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 scroll-mt-header focus:outline-none [&:not(:has([data-full-bleed]))]:pt-header"
      >
        {children}
      </main>

      <SiteFooter />
      <FilmGrain />
      <WebAnalytics />
    </>
  );
}
