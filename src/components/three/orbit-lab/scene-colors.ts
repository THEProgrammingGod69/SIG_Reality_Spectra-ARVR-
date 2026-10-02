import { Color } from 'three';

import { readCssVar } from '@/lib/motion/tokens';

/**
 * Scene colours, read from the design tokens in globals.css at mount.
 *
 * The scene never contains a colour literal: reskinning the site in Stage 3
 * (or changing one token later) recolours the 3D hero with it.
 */
const SCENE_TOKENS = {
  bg: '--color-bg',
  silver: '--color-silver',
  magenta: '--color-spectra-magenta',
  orchid: '--color-spectra-orchid',
  violet: '--color-spectra-violet',
  indigo: '--color-spectra-indigo',
  azure: '--color-spectra-azure',
  blue: '--color-spectra-blue',
  cyan: '--color-spectra-cyan',
} as const;

export type SceneColors = Record<keyof typeof SCENE_TOKENS, Color>;

export function readSceneColors(): SceneColors {
  return Object.fromEntries(
    Object.entries(SCENE_TOKENS).map(([name, cssVar]) => {
      const value = readCssVar(cssVar);
      // An unreadable token renders black (invisible) rather than throwing.
      return [name, value ? new Color().setStyle(value) : new Color()];
    }),
  ) as SceneColors;
}
