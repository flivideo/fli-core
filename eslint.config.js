import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/', 'coverage/', 'node_modules/', 'scripts/'] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/**/*.ts'],
    ignores: ['src/ui/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '^(?!\\.{1,2}/|node:|zod$)',
              message: '@flivideo/core imports only relative modules, zod and node:* (spec §10).',
            },
          ],
        },
      ],
    },
  },
  {
    // The ONE place react may be imported (peer dependency; architecture test fences the rest).
    files: ['src/ui/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '^(?!\\.{1,2}/|react$|react/jsx-runtime$)',
              message: 'src/ui imports only relative modules and react.',
            },
          ],
        },
      ],
    },
  },
);
