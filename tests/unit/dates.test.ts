import { describe, expect, it } from 'vitest';

import { fitWithin } from '@/components/admin/upload-file';
import { formatDate, formatDateTime, fromClubLocalInput, toClubLocalInput } from '@/lib/dates';
import { instant } from '@/lib/schemas/fields';

/** Dates are read and written in India time, whatever the computer's zone. */
describe('club time', () => {
  it('turns a datetime-local value into an ISO time in India time, and back', () => {
    const iso = fromClubLocalInput('2026-10-12T18:00');
    expect(iso).toBe('2026-10-12T18:00:00+05:30');
    expect(instant.parse(iso)).toBe('2026-10-12T12:30:00.000Z');
    expect(toClubLocalInput('2026-10-12T12:30:00.000Z')).toBe('2026-10-12T18:00');
  });

  it('crosses midnight correctly', () => {
    expect(toClubLocalInput('2026-10-12T20:00:00.000Z')).toBe('2026-10-13T01:30');
  });

  it('formats dates the way the club writes them', () => {
    expect(formatDate('2026-10-12T20:00:00.000Z')).toBe('13 Oct 2026');
    expect(formatDateTime('2026-10-12T12:30:00.000Z')).toMatch(/^12 Oct 2026, 6:00\s?pm$/i);
  });
});

describe('fitWithin', () => {
  it('scales the long edge down to the limit, keeping the shape', () => {
    expect(fitWithin(4800, 3600, 2400)).toEqual({ width: 2400, height: 1800 });
    expect(fitWithin(3000, 6000, 2400)).toEqual({ width: 1200, height: 2400 });
  });

  it('never scales up', () => {
    expect(fitWithin(800, 600, 2400)).toEqual({ width: 800, height: 600 });
  });
});
