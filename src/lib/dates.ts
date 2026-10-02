/**
 * Dates as the club reads them: India Standard Time, whatever the server's or
 * visitor's time zone. (Event phases use the same zone: `eventEndsAt` in
 * `src/lib/schemas/event.ts`.)
 */
export const CLUB_TIME_ZONE = 'Asia/Kolkata';

const dateTime = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: CLUB_TIME_ZONE,
});

/** "12 Oct 2026, 6:00 pm" */
export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso));
}
