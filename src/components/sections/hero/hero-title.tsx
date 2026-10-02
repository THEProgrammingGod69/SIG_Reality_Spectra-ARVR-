'use client';

import { FocusText } from '@/components/motion/focus-text';

import { useHeroIntroPhase } from './hero-intro-context';

type HeroTitleProps = {
  id: string;
  text: string;
  className?: string;
};

/**
 * The club name as the page's single <h1>. It is plain text in the server
 * HTML (D-010); while the intro plays, FocusText sweeps a focus frame across
 * the words once, and then rests with every word at full strength.
 */
export function HeroTitle({ id, text, className }: HeroTitleProps) {
  const phase = useHeroIntroPhase();

  return (
    <FocusText
      as="h1"
      id={id}
      text={text}
      mode="once"
      play={phase === 'playing'}
      className={className}
    />
  );
}
