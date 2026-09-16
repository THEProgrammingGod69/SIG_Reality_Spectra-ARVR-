import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';

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
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@upstash/redis',
              message:
                'Data access goes through src/lib/data/*. Only the repository layer may import the Redis client.',
            },
            {
              name: '@vercel/blob',
              message:
                'Blob access goes through src/lib/data/media.ts. Only the repository layer may import the Blob client.',
            },
          ],
        },
      ],
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

  // Must stay last so formatting rules never fight Prettier.
  prettier,
]);

export default eslintConfig;
