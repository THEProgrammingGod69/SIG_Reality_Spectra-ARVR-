import 'server-only';

import type { z } from 'zod';

import contactJson from '@/content/contact.json';
import domainsJson from '@/content/domains.json';
import recruitmentJson from '@/content/recruitment.json';
import siteJson from '@/content/site.json';

import {
  ContactInfoSchema,
  DOMAIN_GROUPS,
  DomainsSchema,
  SiteInfoSchema,
  type Social,
} from './schemas/content';
import { RecruitmentInputSchema } from './schemas/recruitment';

/**
 * The Git-edited content (`src/content/*.json`), validated.
 *
 * Every file is parsed when this module loads — during `next build`, while the
 * pages are prerendered — so a malformed file fails the build with a message
 * naming the file and the field. Server-only: client components receive the
 * values they need as props, so neither the JSON nor Zod reaches the browser.
 */

/** Parse one content file, or throw an error a coordinator can act on. */
export function parseContent<Schema extends z.ZodType>(
  schema: Schema,
  data: unknown,
  file: string,
): z.infer<Schema> {
  const result = schema.safeParse(data);
  if (result.success) return result.data;

  const details = result.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  throw new Error(`Invalid content in src/content/${file}:\n${details}`);
}

export const siteInfo = parseContent(SiteInfoSchema, siteJson, 'site.json');
export const domains = parseContent(DomainsSchema, domainsJson, 'domains.json');
export const contactInfo = parseContent(ContactInfoSchema, contactJson, 'contact.json');
/**
 * INTERIM (D-024): validated by the admin-managed record's own input schema
 * (D-028). Stage 8 reads `getRecruitment()` from the data layer instead and
 * deletes the file; `pnpm seed` copies it into Redis meanwhile.
 */
export const interimRecruitment = parseContent(
  RecruitmentInputSchema,
  recruitmentJson,
  'recruitment.json',
);

/**
 * The domains split into their groups (in DOMAIN_GROUPS order), each keeping
 * its 01–10 number from domains.json so Home and Recruitment always agree.
 */
export const domainGroups = DOMAIN_GROUPS.map((group) => ({
  ...group,
  domains: domains
    .map((domain, index) => ({ ...domain, number: String(index + 1).padStart(2, '0') }))
    .filter((domain) => domain.group === group.id),
}));

export type DomainGroup = (typeof domainGroups)[number];

export type LiveSocial = Social & { href: string };

/** The social channels that are set, in the order contact.json lists them. */
export const socialLinks: readonly LiveSocial[] = contactInfo.socials.filter(
  (social): social is LiveSocial => social.href !== null,
);

/**
 * Public profile pages, for structured data (`sameAs`). Invite links — the
 * WhatsApp community — are channels, not profiles, so they are left out.
 */
export const profileUrls: readonly string[] = socialLinks
  .filter((social) => social.id !== 'whatsapp')
  .map((social) => social.href);

/** A contact channel that is set: what the footer and mobile menu render. */
export type ChannelLink = { readonly label: string; readonly href: string };

export type Channels = {
  readonly email: string | null;
  readonly socials: readonly ChannelLink[];
};

/**
 * The plain, serialisable channel list. The footer renders it directly; the
 * layout passes it to the (client) mobile menu as a prop.
 */
export const siteChannels: Channels = {
  email: contactInfo.email,
  socials: socialLinks.map(({ label, href }) => ({ label, href })),
};

/**
 * Contact details the Contact page is still showing as "Coming soon"
 * placeholders. `pnpm check:launch` fails while any remain (a Stage 10 gate).
 * Optional extras — unset social channels, the map embed — are simply hidden
 * and never count as pending.
 */
export function pendingContent(): string[] {
  const required = {
    email: contactInfo.email,
    phone: contactInfo.phone,
    address: contactInfo.address,
    'map.url': contactInfo.map.url,
  };
  return Object.entries(required)
    .filter(([, value]) => value === null)
    .map(([field]) => `contact.json: ${field}`);
}
