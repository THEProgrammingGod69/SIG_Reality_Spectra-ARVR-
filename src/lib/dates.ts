/**
 * Dates as the club reads them: India Standard Time, whatever the server's or
 * visitor's time zone. Event phases (`src/lib/schemas/event.ts`) use the same
 * offset. IST has no daylight saving, so the offset is fixed.
 */
export const CLUB_TIME_ZONE = 'Asia/Kolkata';
export const CLUB_UTC_OFFSET_MINUTES = 5 * 60 + 30;

const offset = `+${String(Math.floor(CLUB_UTC_OFFSET_MINUTES / 60)).padStart(2, '0')}:${String(
  CLUB_UTC_OFFSET_MINUTES % 60,
).padStart(2, '0')}`;

const dateTime = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: CLUB_TIME_ZONE,
});

const dateOnly = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: CLUB_TIME_ZONE,
});

/** "12 Oct 2026, 6:00 pm" */
export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso));
}

/** "12 Oct 2026" */
export function formatDate(iso: string): string {
  return dateOnly.format(new Date(iso));
}

/**
 * A stored time → the value of an `<input type="datetime-local">`, in club
 * time ("2026-10-12T18:00"), whatever zone the admin's browser is in.
 */
export function toClubLocalInput(iso: string): string {
  const shifted = new Date(Date.parse(iso) + CLUB_UTC_OFFSET_MINUTES * 60_000);
  return shifted.toISOString().slice(0, 16);
}

/** An `<input type="datetime-local">` value, read as club time → ISO 8601. */
export function fromClubLocalInput(value: string): string {
  return `${value.slice(0, 16)}:00${offset}`;
}
