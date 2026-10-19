import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * The proxy runs on every /admin request, and Netlify bundles it into an edge
 * function: it must read the session and nothing else. When it imported the
 * full Auth.js setup, the whole data layer (and the storage SDKs) rode along
 * into that bundle and the Netlify deploy failed (D-041). This walks the
 * proxy's own import graph and fails if the data layer is ever reachable again.
 */

const ROOT = resolve(__dirname, '../..');
const SRC = join(ROOT, 'src');
const IMPORT =
  /(?:import|export)\s[^'"]*?from\s+['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

function resolveLocal(from: string, specifier: string): string | null {
  const base = specifier.startsWith('@/')
    ? join(SRC, specifier.slice(2))
    : specifier.startsWith('.')
      ? resolve(dirname(from), specifier)
      : null;
  if (base === null) return null;
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, join(base, 'index.ts')]) {
    if (existsSync(candidate) && candidate.match(/\.tsx?$/)) return candidate;
  }
  return null;
}

/** Every local module the entry reaches, and every package it imports. */
function importGraph(entry: string) {
  const modules = new Set<string>();
  const packages = new Set<string>();
  const queue = [entry];
  while (queue.length > 0) {
    const file = queue.pop()!;
    if (modules.has(file)) continue;
    modules.add(file);
    for (const match of readFileSync(file, 'utf8').matchAll(IMPORT)) {
      const specifier = match[1] ?? match[2]!;
      const local = resolveLocal(file, specifier);
      if (local) queue.push(local);
      else if (!specifier.startsWith('.') && !specifier.startsWith('@/')) packages.add(specifier);
    }
  }
  return { modules: [...modules].map((file) => relative(ROOT, file)), packages: [...packages] };
}

describe('the proxy bundle', () => {
  const { modules, packages } = importGraph(join(SRC, 'proxy.ts'));

  it('never reaches the data layer or the full Auth.js setup', () => {
    expect(modules.filter((file) => file.startsWith('src/lib/data/'))).toEqual([]);
    expect(modules).not.toContain('src/lib/auth/config.ts');
  });

  it('never imports a storage SDK', () => {
    const storage = packages.filter((name) =>
      /^(@vercel\/blob|@netlify\/blobs|@upstash\/|aws4fetch|undici)/.test(name),
    );
    expect(storage).toEqual([]);
  });

  it('still checks the session against the allowlist', () => {
    expect(modules).toEqual(
      expect.arrayContaining(['src/lib/auth/session-check.ts', 'src/lib/auth/proxy-auth.ts']),
    );
  });
});
