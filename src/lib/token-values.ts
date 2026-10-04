/**
 * Design-token values for the few places that cannot read CSS variables: the
 * browser theme colour (page metadata) and the generated OpenGraph images.
 * Each key names a `--color-*` token in globals.css, and
 * tests/unit/contrast.test.ts fails if any value drifts from its token —
 * so globals.css stays the one source of truth (rule 1).
 */
export const TOKEN_VALUES = {
  bg: '#07060c',
  'surface-raised': '#16131f',
  text: '#f2f2f3',
  muted: '#8e8a9a',
  'spectra-magenta': '#fb00eb',
  'spectra-violet': '#a663fc',
  'spectra-azure': '#6ea6fe',
} as const;
