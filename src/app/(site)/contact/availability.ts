import 'server-only';

import { dataAvailability } from '@/lib/data';
import { turnstileMode } from '@/lib/turnstile';

/**
 * Whether /contact can offer the sponsorship form: there must be somewhere to
 * store the request, and spam protection must not be half set up. Otherwise
 * the page says so and lists the club's channels — never a form that goes
 * nowhere (D-024, D-032). The page and the Server Action both ask this.
 */
export function sponsorshipFormAvailable(): boolean {
  return dataAvailability().records && turnstileMode() !== 'unavailable';
}
