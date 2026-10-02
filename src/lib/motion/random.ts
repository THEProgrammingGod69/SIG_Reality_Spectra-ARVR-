/**
 * A small deterministic PRNG (mulberry32).
 *
 * The hero's star field, particles and static still are generated from fixed
 * seeds, so the scene looks the same on every load and the server-rendered
 * still never differs between server and client.
 */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
