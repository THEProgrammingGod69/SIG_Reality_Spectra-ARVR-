import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { seededRandom } from '@/lib/motion/random';
import {
  MOTION_TOKEN_VARS,
  motionTokensFrom,
  parseCubicBezier,
  parseDuration,
  parseLength,
} from '@/lib/motion/tokens';

const globalsCss = readFileSync(join(process.cwd(), 'src', 'app', 'globals.css'), 'utf8');

/** The CSS between the first `{` after `marker` and its matching `}`. */
function blockAfter(marker: string): string {
  const start = globalsCss.indexOf(marker);
  if (start === -1) throw new Error(`missing ${marker} in globals.css`);
  const open = globalsCss.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < globalsCss.length; i += 1) {
    if (globalsCss[i] === '{') depth += 1;
    if (globalsCss[i] === '}') depth -= 1;
    if (depth === 0) return globalsCss.slice(open + 1, i);
  }
  throw new Error(`unterminated block after ${marker}`);
}

function declarations(block: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const match of block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    map.set(match[1]!, match[2]!.trim());
  }
  return map;
}

describe('motion tokens in globals.css', () => {
  const theme = declarations(blockAfter('@theme'));

  it('defines every token the motion system reads', () => {
    for (const cssVar of MOTION_TOKEN_VARS) {
      expect(theme.has(cssVar), `${cssVar} missing from @theme`).toBe(true);
    }
  });

  it('holds the Stage 2 values', () => {
    const tokens = motionTokensFrom((cssVar) => theme.get(cssVar) ?? '');
    expect(tokens.dur).toEqual({ micro: 0.15, short: 0.3, medium: 0.6, long: 1.2 });
    expect(tokens.ease.outExpo).toEqual([0.16, 1, 0.3, 1]);
    expect(tokens.ease.inOut).toEqual([0.65, 0, 0.35, 1]);
    expect(tokens.stagger).toBeCloseTo(0.07);
    expect(tokens.rise).toBe(24);
  });

  it('collapses every duration, the stagger and the travel under reduced motion', () => {
    const reduced = declarations(blockAfter('@media (prefers-reduced-motion: reduce)'));
    const collapsed = motionTokensFrom((cssVar) => reduced.get(cssVar) ?? theme.get(cssVar) ?? '');
    expect(Object.values(collapsed.dur)).toEqual([0, 0, 0, 0]);
    expect(collapsed.stagger).toBe(0);
    expect(collapsed.rise).toBe(0);
  });
});

describe('parseDuration', () => {
  it('reads milliseconds and seconds as seconds', () => {
    expect(parseDuration('150ms')).toBe(0.15);
    expect(parseDuration(' 1.2s ')).toBe(1.2);
    expect(parseDuration('0ms')).toBe(0);
  });

  it('degrades anything unreadable to no animation', () => {
    expect(parseDuration('')).toBe(0);
    expect(parseDuration('fast')).toBe(0);
    expect(parseDuration('-100ms')).toBe(0);
  });
});

describe('parseCubicBezier', () => {
  it('reads a CSS cubic-bezier()', () => {
    expect(parseCubicBezier('cubic-bezier(0.16, 1, 0.3, 1)')).toEqual([0.16, 1, 0.3, 1]);
    expect(parseCubicBezier('cubic-bezier(.65,0,.35,1)')).toEqual([0.65, 0, 0.35, 1]);
  });

  it('rejects malformed curves and out-of-range x values', () => {
    expect(parseCubicBezier('ease-out')).toBeNull();
    expect(parseCubicBezier('cubic-bezier(0, 1, 1)')).toBeNull();
    expect(parseCubicBezier('cubic-bezier(1.2, 0, 0.3, 1)')).toBeNull();
  });
});

describe('parseLength', () => {
  it('reads rem against the root font size, and px as-is', () => {
    expect(parseLength('1.5rem')).toBe(24);
    expect(parseLength('1.5rem', 20)).toBe(30);
    expect(parseLength('24px')).toBe(24);
    expect(parseLength('auto')).toBe(0);
  });
});

describe('seededRandom', () => {
  it('is deterministic, so the server-rendered still matches the client', () => {
    const a = seededRandom(3);
    const b = seededRandom(3);
    const first = Array.from({ length: 5 }, a);
    expect(Array.from({ length: 5 }, b)).toEqual(first);
    for (const value of first) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});
