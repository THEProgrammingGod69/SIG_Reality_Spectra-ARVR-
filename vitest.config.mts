import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Resolves the "@/*" path alias straight from tsconfig.json.
    tsconfigPaths: true,
    alias: {
      // See tests/stubs/server-only.ts for why this alias exists.
      'server-only': fileURLToPath(new URL('./tests/stubs/server-only.ts', import.meta.url)),
    },
  },
  test: {
    // Vitest covers schemas and pure utilities. Browser behaviour is Playwright's job.
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    restoreMocks: true,
  },
});
