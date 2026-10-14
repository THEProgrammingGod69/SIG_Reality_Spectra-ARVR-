import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge, taught our design tokens (globals.css `@theme`).
 *
 * Without this it cannot tell that `text-display-xl` is a font size and
 * `text-(--color-muted)` a colour, and would drop one of them; nor that
 * `py-section` and `py-4` conflict. Add a key here whenever a new token
 * namespace value is added to `@theme`.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        'display-3xl',
        'display-2xl',
        'display-xl',
        'display-lg',
        'display-md',
        'display-sm',
        'numeral',
        'body-lg',
        'body',
        'body-sm',
        'label',
      ],
      spacing: ['gutter', 'section', 'header'],
      container: ['content', 'prose'],
      radius: ['control', 'card'],
      shadow: ['card', 'glow'],
      blur: ['glass'],
    },
  },
});

/**
 * Join class names, letting later classes win over earlier conflicting ones.
 * The one class helper for the whole project — public UI and the shadcn admin
 * components (components.json points its `utils` alias here).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
