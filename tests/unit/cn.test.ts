import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { cn } from '@/lib/cn';

describe('cn', () => {
  it('joins conditional classes', () => {
    expect(cn('a', false && 'b', null, undefined, ['c', { d: true, e: false }])).toBe('a c d');
  });

  it('keeps a token font size and a token colour together', () => {
    // Untaught tailwind-merge would treat both as `text-*` and drop one.
    expect(cn('text-display-xl', 'text-(--color-muted)')).toBe(
      'text-display-xl text-(--color-muted)',
    );
    expect(cn('text-label', 'text-(--color-accent)')).toBe('text-label text-(--color-accent)');
  });

  it('lets a later token override an earlier one in the same group', () => {
    expect(cn('text-display-sm', 'text-label')).toBe('text-label');
    expect(cn('py-section', 'py-4')).toBe('py-4');
    expect(cn('rounded-card', 'rounded-control')).toBe('rounded-control');
    expect(cn('max-w-content', 'max-w-prose')).toBe('max-w-prose');
    expect(cn('shadow-card', 'shadow-glow')).toBe('shadow-glow');
    expect(cn('relative', 'absolute')).toBe('absolute');
  });

  it('knows every font-size token declared in globals.css', () => {
    const css = readFileSync(join(process.cwd(), 'src', 'app', 'globals.css'), 'utf8');
    const sizes = [...css.matchAll(/--text-([\w-]+?)\s*:/g)]
      .map((match) => match[1]!)
      .filter((name) => !name.includes('--'));
    expect(sizes.length).toBeGreaterThan(0);
    for (const size of sizes) {
      // A known font size merges away an earlier one; an unknown one would not.
      expect(cn('text-body', `text-${size}`), `text-${size}`).toBe(`text-${size}`);
    }
  });
});
