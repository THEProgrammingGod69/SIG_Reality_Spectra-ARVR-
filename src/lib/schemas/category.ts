import { z } from 'zod';

/**
 * The one category list shared by events and standalone gallery photos, so a
 * gallery filter means the same thing whichever source a photo came from
 * (D-026). Order is the order the filters appear in.
 *
 * Adding a category is one entry here. Removing one that records still use
 * would make those records fail validation on read, so rename or migrate them
 * first.
 */
export const CATEGORIES = [
  { id: 'hackathon', label: 'Hackathons' },
  { id: 'competition', label: 'Competitions' },
  { id: 'workshop', label: 'Workshops' },
  { id: 'other', label: 'Other' },
] as const;

export type Category = (typeof CATEGORIES)[number]['id'];

export const CategorySchema = z.enum(
  CATEGORIES.map((category) => category.id) as [Category, ...Category[]],
  { error: 'Choose one of the categories' },
);

export function categoryLabel(id: Category): string {
  return CATEGORIES.find((category) => category.id === id)?.label ?? id;
}
