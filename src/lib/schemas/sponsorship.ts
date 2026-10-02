import { z } from 'zod';

import { entitySchemas, phone, recordId, text } from './fields';

/**
 * A sponsorship or collaboration request sent from /contact and read in
 * /admin/sponsorships. There is no email integration (D-008).
 */
export const SPONSORSHIP_TYPES = [
  { id: 'sponsorship', label: 'Sponsorship' },
  { id: 'collaboration', label: 'Collaboration' },
  { id: 'other', label: 'Something else' },
] as const;

/** The admin's triage status. New requests are `new`. */
export const SPONSORSHIP_STATUSES = [
  { id: 'new', label: 'New' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'closed', label: 'Closed' },
] as const;

type SponsorshipType = (typeof SPONSORSHIP_TYPES)[number]['id'];
export type SponsorshipStatus = (typeof SPONSORSHIP_STATUSES)[number]['id'];

const { input, record } = entitySchemas({
  id: recordId,
  name: text(2, 80),
  organisation: text(2, 120),
  email: z.email({ error: 'Enter a valid email address' }).max(254),
  phone: phone.nullable().default(null),
  type: z.enum(SPONSORSHIP_TYPES.map((type) => type.id) as [SponsorshipType, ...SponsorshipType[]]),
  message: text(20, 2000),
  status: z
    .enum(
      SPONSORSHIP_STATUSES.map((status) => status.id) as [
        SponsorshipStatus,
        ...SponsorshipStatus[],
      ],
    )
    .default('new'),
});

export const SponsorshipRequestInputSchema = input;
export const SponsorshipRequestSchema = record;

/**
 * What a visitor fills in on /contact: the request without the id (the server
 * assigns it) and without the status (only an admin sets that).
 */
export const SponsorshipFormSchema = SponsorshipRequestInputSchema.omit({ id: true, status: true });

export type SponsorshipForm = z.input<typeof SponsorshipFormSchema>;
export type SponsorshipRequest = z.output<typeof SponsorshipRequestSchema>;
