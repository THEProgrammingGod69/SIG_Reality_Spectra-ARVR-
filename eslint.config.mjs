import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';

const redisClient = {
  name: '@upstash/redis',
  message:
    'Data access goes through src/lib/data/*. Only the repository layer may import the Redis client.',
};
const blobServerClient = {
  name: '@vercel/blob',
  message:
    'Blob access goes through src/lib/data/media.ts. Only the repository layer may import the Blob client.',
};
const blobBrowserClient = {
  name: '@vercel/blob/client',
  message:
    'Browser uploads use the shared uploader in src/components/admin; token issuing lives in src/lib/data/media.ts.',
};
const storageClients = [redisClient, blobServerClient, blobBrowserClient];

const eslintConfig = defineConfig([
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
    'next-env.d.ts',
    'references/**',
  ]),

  ...nextVitals,
  ...nextTs,

  {
    rules: {
      // CLAUDE.md rule: UI never imports the Redis/Blob clients directly.
      // Enforced here so the rule is a build failure, not a code-review opinion.
      'no-restricted-imports': ['error', { paths: storageClients }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
    },
  },

  {
    // The repository layer is the one place allowed to talk to Redis/Blob.
    files: ['src/lib/data/**/*.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },

  {
    // Admin upload widgets send files straight from the browser to Blob
    // (server function bodies are size-capped), so they may use the browser
    // client — but still never the server clients.
    files: ['src/components/admin/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { paths: [redisClient, blobServerClient] }],
    },
  },

  // Must stay last so formatting rules never fight Prettier.
  prettier,
]);

export default eslintConfig;
