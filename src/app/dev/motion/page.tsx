import type { Metadata } from 'next';

import { MotionPlayground } from './motion-playground';

export const metadata: Metadata = { title: 'Motion playground' };

/** Every motion primitive in isolation. Development only (see ../layout.tsx). */
export default function MotionPlaygroundPage() {
  return <MotionPlayground />;
}
