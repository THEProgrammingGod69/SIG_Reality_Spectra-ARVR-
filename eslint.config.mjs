import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';

const redisClient = {
  name: '@upstash/redis',
  message:
    'Data access goes through src/lib/data/*. Only the repository layer may import the Redis client.',
};
const objectStorageClient = {
  name: 'aws4fetch',
  message:
    'File storage goes through src/lib/data/media.ts. Only the repository layer may sign R2 requests.',
};
const blobsClient = {
  name: '@netlify/blobs',
  message:
    'Data access goes through src/lib/data/*. Only the repository layer may open Netlify Blobs stores.',
};
const storageClients = [redisClient, objectStorageClient, blobsClient];

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
      // CLAUDE.md rule: UI never imports the Redis/R2 clients directly.
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
    // The repository layer is the one place allowed to talk to Redis, R2 and
    // Netlify Blobs; its own tests may start the SDK's local Blobs server.
    files: ['src/lib/data/**/*.ts', 'tests/unit/data/**/*.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },

  // Admin upload widgets need no storage client at all: they PUT the file to
  // the presigned URL from /api/admin/upload with plain fetch.

  // Must stay last so formatting rules never fight Prettier.
  prettier,
]);

export default eslintConfig;
