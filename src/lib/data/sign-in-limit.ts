import type { RecordStore } from './adapters/types';

/**
 * The cap on admin password sign-in attempts. A wall for a script guessing
 * passwords, never for an admin who mistypes: an attempt is counted against
 * the client's address and against the email it names, and either one over
 * its limit refuses the attempt until its window has passed.
 */
export const SIGN_IN_LIMITS = {
  address: { attempts: 10, windowSeconds: 15 * 60 },
  email: { attempts: 20, windowSeconds: 15 * 60 },
} as const;

/** Above this many live counters, the in-memory limiter drops expired ones. */
const MEMORY_PRUNE_AT = 10_000;

/** Anything that counts hits in a window: the record store, or memory. */
export type HitCounter = Pick<RecordStore, 'hit'>;

/**
 * `RecordStore.hit()` in one process's memory: the fallback where there is no
 * data store, or the store is failing. Its counts reset when the process does
 * and are not shared between serverless instances, so it is weaker than the
 * store — but an outage must never lock the admins out, nor open the door.
 */
export function createMemoryCounter(now: () => number = Date.now): HitCounter {
  const counters = new Map<string, { hits: number; expiresAt: number }>();
  return {
    async hit(key, windowSeconds) {
      const time = now();
      if (counters.size >= MEMORY_PRUNE_AT) {
        for (const [entry, counter] of counters) {
          if (counter.expiresAt <= time) counters.delete(entry);
        }
      }
      const current = counters.get(key);
      const counter =
        current && current.expiresAt > time
          ? { ...current, hits: current.hits + 1 }
          : { hits: 1, expiresAt: time + windowSeconds * 1000 };
      counters.set(key, counter);
      return counter.hits;
    },
  };
}

/**
 * A counter key that names no one: a hash of the address or email, so the
 * store never holds either in the clear.
 */
async function counterKey(kind: 'address' | 'email', value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0'));
  return `sign-in:${kind}:${hex.join('').slice(0, 32)}`;
}

export type SignInAttempt = {
  /** The client's address (`clientAddress()` in src/lib/auth/policy.ts). */
  address: string;
  /** The email typed, trimmed and lowercased. */
  email: string;
};

export type SignInLimit = {
  /** Count one attempt; false when it is over either limit and must be refused. */
  allow(attempt: SignInAttempt): Promise<boolean>;
};

/**
 * The sign-in attempt limit, on the record store's `hit()` counters when
 * there is a store (shared by every serverless instance), and in memory when
 * there is none or it fails.
 */
export function createSignInLimit({
  store,
  now = Date.now,
}: {
  store: HitCounter | null;
  now?: () => number;
}): SignInLimit {
  const memory = createMemoryCounter(now);

  async function count(key: string, windowSeconds: number): Promise<number> {
    if (store) {
      try {
        return await store.hit(key, windowSeconds);
      } catch (error) {
        console.warn('[auth] The sign-in limit fell back to memory: the data store failed.', error);
      }
    }
    return memory.hit(key, windowSeconds);
  }

  return {
    async allow({ address, email }) {
      const [byAddress, byEmail] = await Promise.all([
        counterKey('address', address).then((key) =>
          count(key, SIGN_IN_LIMITS.address.windowSeconds),
        ),
        counterKey('email', email).then((key) => count(key, SIGN_IN_LIMITS.email.windowSeconds)),
      ]);
      return (
        byAddress <= SIGN_IN_LIMITS.address.attempts && byEmail <= SIGN_IN_LIMITS.email.attempts
      );
    },
  };
}
