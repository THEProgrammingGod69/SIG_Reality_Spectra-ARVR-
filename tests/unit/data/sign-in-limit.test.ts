import { describe, expect, it, vi } from 'vitest';

import { createMemoryStore } from '@/lib/data/adapters/memory-store';
import { createSignInLimit, SIGN_IN_LIMITS, type HitCounter } from '@/lib/data/sign-in-limit';

/** The admin password sign-in's attempt limit. */

const WINDOW_MS = SIGN_IN_LIMITS.address.windowSeconds * 1000;

/** A limiter on memory only, with a clock the test moves. */
function memoryLimit() {
  let time = Date.parse('2026-10-15T09:00:00Z');
  const limit = createSignInLimit({ store: null, now: () => time });
  return { limit, advance: (ms: number) => (time += ms) };
}

async function attempts(
  limit: ReturnType<typeof createSignInLimit>,
  count: number,
  attempt: (index: number) => { address: string; email: string },
) {
  const results: boolean[] = [];
  for (let index = 0; index < count; index += 1) results.push(await limit.allow(attempt(index)));
  return results;
}

describe('createSignInLimit, in memory', () => {
  it('allows 10 attempts from one address in the window, then refuses', async () => {
    const { limit } = memoryLimit();
    // A different email each time, so only the address limit applies.
    const results = await attempts(limit, 12, (index) => ({
      address: '203.0.113.9',
      email: `guess-${index}@example.org`,
    }));
    expect(results).toEqual([...Array<boolean>(10).fill(true), false, false]);
  });

  it('allows 20 attempts at one email across addresses, then refuses', async () => {
    const { limit } = memoryLimit();
    const results = await attempts(limit, 21, (index) => ({
      address: `198.51.100.${index}`,
      email: 'first@vit.edu',
    }));
    expect(results.filter(Boolean)).toHaveLength(SIGN_IN_LIMITS.email.attempts);
    expect(results.at(-1)).toBe(false);
  });

  it('counts each address and each email on its own', async () => {
    const { limit } = memoryLimit();
    await attempts(limit, 11, (index) => ({ address: '203.0.113.9', email: `x${index}@a.org` }));
    expect(await limit.allow({ address: '203.0.113.9', email: 'first@vit.edu' })).toBe(false);
    expect(await limit.allow({ address: '203.0.113.10', email: 'first@vit.edu' })).toBe(true);
  });

  it('opens again once the window has passed', async () => {
    const { limit, advance } = memoryLimit();
    const attempt = { address: '203.0.113.9', email: 'first@vit.edu' };
    await attempts(limit, 10, () => attempt);
    expect(await limit.allow(attempt)).toBe(false);
    advance(WINDOW_MS - 1);
    expect(await limit.allow(attempt)).toBe(false);
    advance(1);
    expect(await limit.allow(attempt)).toBe(true);
  });
});

describe('createSignInLimit, on the record store', () => {
  it('counts in the store, under keys that never hold the address or email', async () => {
    const store = createMemoryStore();
    const hit = vi.spyOn(store, 'hit');
    const limit = createSignInLimit({ store });

    const results = await attempts(limit, 11, () => ({
      address: '203.0.113.9',
      email: 'first@vit.edu',
    }));
    expect(results.at(9)).toBe(true);
    expect(results.at(10)).toBe(false);

    const keys = hit.mock.calls.map(([key]) => key);
    expect(new Set(keys).size).toBe(2);
    for (const key of keys) {
      expect(key).toMatch(/^sign-in:(address|email):[0-9a-f]{32}$/);
      expect(key).not.toContain('203.0.113.9');
      expect(key).not.toContain('first@vit.edu');
    }
  });

  it('falls back to memory when the store fails, never locking admins out', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const failing: HitCounter = { hit: () => Promise.reject(new Error('Upstash is down')) };
    const limit = createSignInLimit({ store: failing });
    const attempt = { address: '203.0.113.9', email: 'first@vit.edu' };

    expect(await limit.allow(attempt)).toBe(true);
    // ...and the limit still holds, in memory.
    const results = await attempts(limit, 10, () => attempt);
    expect(results.at(-1)).toBe(false);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
