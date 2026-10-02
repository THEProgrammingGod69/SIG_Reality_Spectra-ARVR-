'use client';

import { createContext, useContext } from 'react';

/**
 * Where the hero's first-load intro is.
 *   idle    — not started (server render, static tier, or the canvas is loading)
 *   playing — the scene is drawing itself in; the name sweep runs alongside
 *   done    — finished, skipped, or already seen this session
 */
export type HeroIntroPhase = 'idle' | 'playing' | 'done';

export const HeroIntroContext = createContext<HeroIntroPhase>('idle');

export function useHeroIntroPhase(): HeroIntroPhase {
  return useContext(HeroIntroContext);
}
