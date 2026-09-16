/**
 * Test stub for the `server-only` package.
 *
 * The real package throws when it is resolved outside a React Server Component
 * graph, which is exactly what we want in the app and exactly what breaks a
 * plain Node unit test. `vitest.config.ts` aliases `server-only` to this no-op
 * so modules such as `src/lib/env.ts` stay testable.
 */
export {};
