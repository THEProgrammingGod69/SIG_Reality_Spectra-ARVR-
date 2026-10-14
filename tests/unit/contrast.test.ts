import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { contrastRatio, luminance, WCAG_AA_TEXT, WCAG_AA_UI } from '@/lib/contrast';
import { TOKEN_VALUES } from '@/lib/token-values';

/**
 * WCAG AA audit of the colour tokens, as the design system actually pairs
 * them. Changing a token value in globals.css re-runs this audit; a pairing
 * that drops below AA fails the build.
 */

const root = process.cwd();
const css = readFileSync(join(root, 'src', 'app', 'globals.css'), 'utf8');

/** Every `--color-*` declared in globals.css, with `var(--color-x)` aliases resolved. */
function colourTokens(): Map<string, string> {
  const raw = new Map<string, string>();
  for (const match of css.matchAll(/--color-([\w-]+)\s*:\s*([^;]+);/g)) {
    if (!raw.has(match[1]!)) raw.set(match[1]!, match[2]!.trim());
  }
  const resolve = (name: string, seen = new Set<string>()): string | null => {
    const value = raw.get(name);
    if (!value || seen.has(name)) return null;
    const alias = /^var\(--color-([\w-]+)\)$/.exec(value);
    if (alias) return resolve(alias[1]!, seen.add(name));
    return /^#[0-9a-f]{3,6}$/i.test(value) ? value : null;
  };
  const resolved = new Map<string, string>();
  for (const name of raw.keys()) {
    const hex = resolve(name);
    if (hex) resolved.set(name, hex);
  }
  return resolved;
}

const tokens = colourTokens();
const colour = (name: string) => {
  const value = tokens.get(name);
  if (!value) throw new Error(`--color-${name} is missing or not a hex value`);
  return value;
};

const surfaces = ['bg', 'surface', 'surface-raised'] as const;

describe('contrast helpers', () => {
  it('match the WCAG reference values', () => {
    expect(luminance('#000000')).toBe(0);
    expect(luminance('#ffffff')).toBeCloseTo(1);
    expect(contrastRatio('#000', '#fff')).toBeCloseTo(21);
    expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.48, 2);
    expect(contrastRatio('#123456', '#123456')).toBe(1);
  });

  it('rejects values that are not hex colours', () => {
    expect(() => luminance('rebeccapurple')).toThrow(/Not a hex colour/);
  });
});

describe('colour tokens meet WCAG AA', () => {
  it.each(['text', 'text-body', 'muted', 'subtle', 'accent'])(
    '--color-%s reads as text on every surface (4.5:1)',
    (name) => {
      for (const surface of surfaces) {
        expect(
          contrastRatio(colour(name), colour(surface)),
          `${name} on ${surface}`,
        ).toBeGreaterThanOrEqual(WCAG_AA_TEXT);
      }
    },
  );

  it('primary button label reads on the accent fill', () => {
    expect(contrastRatio(colour('accent-contrast'), colour('accent'))).toBeGreaterThanOrEqual(
      WCAG_AA_TEXT,
    );
  });

  it.each(['success', 'warning', 'danger'])(
    '--color-%s reads as badge and message text',
    (name) => {
      for (const surface of surfaces) {
        expect(contrastRatio(colour(name), colour(surface))).toBeGreaterThanOrEqual(WCAG_AA_TEXT);
      }
    },
  );

  it('HudNav labels, numbers and its scroll readout read on the glass (D-038)', () => {
    for (const tone of ['muted', 'subtle', 'accent']) {
      expect(contrastRatio(colour(tone), colour('bg'))).toBeGreaterThanOrEqual(WCAG_AA_TEXT);
    }
  });

  it('form control borders are visible boundaries (3:1)', () => {
    for (const surface of surfaces) {
      expect(contrastRatio(colour('subtle'), colour(surface))).toBeGreaterThanOrEqual(WCAG_AA_UI);
    }
  });

  it('the focus ring is visible on every surface (3:1)', () => {
    for (const surface of surfaces) {
      expect(contrastRatio(colour('accent'), colour(surface))).toBeGreaterThanOrEqual(WCAG_AA_UI);
    }
  });
});

describe('mirrored token values', () => {
  it.each(Object.entries(TOKEN_VALUES))(
    '%s matches its --color token (metadata and share images cannot read CSS variables)',
    (name, value) => {
      expect(value.toLowerCase()).toBe(colour(name).toLowerCase());
    },
  );
});
