import 'server-only';

import { dataAvailability } from '@/lib/data';

/**
 * Whether /contact can offer the sponsorship form: there must be somewhere to
 * store the request. Otherwise the page says so and lists the club's channels
 * — never a form that goes nowhere (D-024, D-032). Spam protection never hides
 * it: without Turnstile keys the honeypot and rate limit guard it (D-041). The
 * page and the Server Action both ask this.
 */
export function sponsorshipFormAvailable(): boolean {
  return dataAvailability().records;
}
