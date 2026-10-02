import { describe, expect, it } from 'vitest';

import { pendingContent } from '@/lib/content';

/**
 * Launch readiness — run with `pnpm check:launch` (Vitest `--mode launch`).
 *
 * Skipped in the everyday `pnpm test`: placeholders are allowed while the site
 * is being built (D-024). Before go-live (Stage 10) this must pass, so no
 * "Coming soon" contact detail reaches the live site.
 */
describe('launch readiness', () => {
  it.runIf(import.meta.env.MODE === 'launch')('no contact detail is still pending', () => {
    expect(pendingContent(), 'Fill these in src/content/contact.json').toEqual([]);
  });
});
