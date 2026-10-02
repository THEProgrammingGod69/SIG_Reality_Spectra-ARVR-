/**
 * The values the hero choreography drives and the scene reads every frame.
 *
 * GSAP tweens these numbers (intro timeline, scroll-out scrub) and pointer
 * handlers write the pointer; `useFrame` copies them into uniforms. Nothing
 * here causes a React render — the scene animates without re-rendering.
 */
export type HeroSceneState = {
  /** 0 → 1: the headset outline draws in, left to right. */
  draw: number;
  /** 0 → 1: particles converge onto the outline. */
  converge: number;
  /** 0 → 1: the orbit ring ignites, left to right. */
  ignite: number;
  /** 0 → 1: the horizon glow fades up. */
  horizon: number;
  /** 0 → 1: scroll-out progress while the hero is pinned. */
  scroll: number;
  /** Pointer position over the hero, -1 → 1 on each axis (high tier only). */
  pointerX: number;
  pointerY: number;
};

/** The intro channels, in the order the choreography plays them. */
export const INTRO_CHANNELS = ['draw', 'converge', 'ignite', 'horizon'] as const;

/** `introDone` starts the scene in its idle state, with no intro to play. */
export function createHeroSceneState(introDone = false): HeroSceneState {
  const start = introDone ? 1 : 0;
  return {
    draw: start,
    converge: start,
    ignite: start,
    horizon: start,
    scroll: 0,
    pointerX: 0,
    pointerY: 0,
  };
}
