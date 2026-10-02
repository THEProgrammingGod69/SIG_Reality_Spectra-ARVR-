import { siteConfig } from './site';

/**
 * schema.org structured data for search engines (JSON-LD). Pure functions, so
 * the output is unit-tested; the home page renders it in a <script> tag.
 */

type OrganizationInput = {
  siteUrl: string;
  description: string;
  slogan: string;
  email: string | null;
  /** Public profile pages (`sameAs`). Invite links such as WhatsApp are not profiles. */
  profiles: readonly string[];
};

export function organizationJsonLd({
  siteUrl,
  description,
  slogan,
  email,
  profiles,
}: OrganizationInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: new URL('/', siteUrl).toString(),
    logo: new URL('/icon.png', siteUrl).toString(),
    description,
    slogan,
    parentOrganization: { '@type': 'CollegeOrUniversity', name: siteConfig.parentOrganisation },
    ...(email ? { email } : {}),
    ...(profiles.length > 0 ? { sameAs: [...profiles] } : {}),
  };
}

/**
 * Serialise for a <script type="application/ld+json">. `<` is escaped so no
 * value can close the script tag early.
 */
export function jsonLdScript(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
