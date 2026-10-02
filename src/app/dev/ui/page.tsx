import type { Metadata } from 'next';

import { UiPlayground } from './ui-playground';

export const metadata: Metadata = { title: 'UI playground' };

/** Every design-system primitive in every state. Development only (see ../layout.tsx). */
export default function UiPlaygroundPage() {
  return <UiPlayground />;
}
