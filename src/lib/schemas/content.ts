import { z } from 'zod';

import { httpsUrl, phone, slug, text } from './fields';

/**
 * Schemas for the Git-edited content in `src/content` (Stage 4).
 *
 * Each file is parsed once, at build time, by `src/lib/content.ts`; a value
 * that breaks a rule here fails `pnpm build` with the file and field named.
 * Length limits are set so every layout that renders a field stays intact.
 */

/* -------------------------------------------------------------------------- */
/* site.json                                                                  */
/* -------------------------------------------------------------------------- */

export const SiteInfoSchema = z.object({
  /** The hero's one-line intro (used verbatim, per the content brief). */
  tagline: text(10, 120),
  /** "Explore. Build. Express." */
  motto: text(3, 60),
  /** The positioning line — also the site's meta description. */
  positioning: text(40, 160),
  mission: text(40, 600),
  vision: text(40, 600),
  about: z.object({
    /** Home page "who we are". */
    short: text(40, 400),
    /** Home page: the lit card beside "who we are" (D-039, from the "Who we are" section on main). */
    card: z.object({ title: text(3, 60), body: text(40, 300) }),
    /** About page, one string per paragraph. */
    long: z.array(text(40, 1200)).min(1).max(6),
  }),
});

export type SiteInfo = z.infer<typeof SiteInfoSchema>;

/* -------------------------------------------------------------------------- */
/* domains.json                                                               */
/* -------------------------------------------------------------------------- */

/**
 * The two equal halves of the club (content brief: presented with a clear
 * hierarchy between them, but as equally important parts of one ecosystem).
 */
export const DOMAIN_GROUPS = [
  { id: 'technical', label: 'Technical' },
  { id: 'non-technical', label: 'Non-technical' },
] as const;

export type DomainGroupId = (typeof DOMAIN_GROUPS)[number]['id'];

export const DomainSchema = z.object({
  /** Stable slug, used as a React key and an in-page anchor. */
  id: slug,
  name: text(2, 40),
  group: z.enum(DOMAIN_GROUPS.map((group) => group.id) as [DomainGroupId, ...DomainGroupId[]]),
  description: text(20, 280),
});

export const DomainsSchema = z
  .array(DomainSchema)
  .min(1)
  .max(24)
  .superRefine((domains, ctx) => {
    const seen = new Set<string>();
    domains.forEach((domain, index) => {
      if (seen.has(domain.id)) {
        ctx.addIssue({
          code: 'custom',
          path: [index, 'id'],
          message: `Duplicate id "${domain.id}"`,
        });
      }
      seen.add(domain.id);
    });
  });

export type Domain = z.infer<typeof DomainSchema>;

/* -------------------------------------------------------------------------- */
/* contact.json                                                               */
/* -------------------------------------------------------------------------- */

/**
 * `null` means "not supplied yet": the page shows a "Coming soon" placeholder
 * instead of a link, so no fake or broken contact detail ever ships, and
 * `pendingContent()` lists what is still missing before launch.
 */
export const SOCIAL_IDS = ['instagram', 'whatsapp', 'linkedin', 'github'] as const;

export const SocialSchema = z.object({
  id: z.enum(SOCIAL_IDS),
  label: text(2, 40),
  /** Shown under the QR code, e.g. "@sig_realityspectra". */
  handle: text(2, 60).nullable(),
  href: httpsUrl.nullable(),
  /** Call to action on the button, e.g. "Follow on Instagram". */
  action: text(2, 40),
  /** Show a scannable QR code for this channel on the Contact page. */
  qr: z.boolean(),
});

export type Social = z.infer<typeof SocialSchema>;

export const ContactInfoSchema = z.object({
  email: z.email().nullable(),
  phone: phone.nullable(),
  address: text(5, 200).nullable(),
  map: z.object({
    /** "Open in Google Maps" link. */
    url: httpsUrl.nullable(),
    /** Google Maps embed URL (Share → Embed a map → the iframe's `src`). */
    embedUrl: httpsUrl
      .refine((url) => url.startsWith('https://www.google.com/maps/embed'), {
        message: 'Must be a https://www.google.com/maps/embed… URL',
      })
      .nullable(),
  }),
  socials: z.array(SocialSchema).superRefine((socials, ctx) => {
    const seen = new Set<string>();
    socials.forEach((social, index) => {
      if (seen.has(social.id)) {
        ctx.addIssue({ code: 'custom', path: [index, 'id'], message: `Duplicate "${social.id}"` });
      }
      seen.add(social.id);
    });
  }),
});

export type ContactInfo = z.infer<typeof ContactInfoSchema>;
