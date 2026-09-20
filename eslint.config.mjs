import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import eslintConfigPrettier from 'eslint-config-prettier'
import tseslint from 'typescript-eslint'

const layerBoundaryZones = [
  {
    target: './src/app',
    from: './src/server/services',
    message: 'Routes must not import services directly. Use features/.',
  },
  {
    target: './src/app',
    from: './src/server/auth',
    message: 'Routes must not import auth directly. Use features/.',
  },
  {
    target: './src/app',
    from: './src/server/repositories',
    message: 'Routes must not import repositories. Use features/.',
  },
  {
    target: './src/app',
    from: './src/server/db',
    message: 'Routes must not import the database layer directly.',
  },
  {
    target: './src/app',
    from: './src/server/errors',
    message: 'Routes must not import server errors directly. Use features/.',
  },
  {
    target: './src/app',
    from: './src/server/cache',
    message: 'Routes must not import server cache helpers directly. Use features/.',
  },
  {
    target: './src/features',
    from: './src/app',
    message: 'Features must not import from app/.',
  },
  {
    target: './src/features',
    from: './src/server/repositories',
    message: 'Features must not import repositories. Use server/services/.',
  },
  {
    target: './src/features',
    from: './src/server/db',
    message: 'Features must not import the database layer directly.',
  },
  {
    target: './src/features',
    from: './src/server/auth',
    message: 'Features must not import auth directly. Use server/services/.',
  },
  {
    target: './src/server/services',
    from: './src/app',
    message: 'Services must not import from app/.',
  },
  {
    target: './src/server/services',
    from: './src/features',
    message: 'Services must not import from features/.',
  },
  {
    target: './src/server/repositories',
    from: './src/app',
    message: 'Repositories must not import from app/.',
  },
  {
    target: './src/server/repositories',
    from: './src/features',
    message: 'Repositories must not import from features/.',
  },
  {
    target: './src/server/repositories',
    from: './src/server/services',
    message: 'Repositories must not import from services/.',
  },
  {
    target: './src/lib',
    from: './src/app',
    message: 'lib/ is pure and must not import from app/.',
  },
  {
    target: './src/lib',
    from: './src/features',
    message: 'lib/ is pure and must not import from features/.',
  },
  {
    target: './src/lib',
    from: './src/server',
    message: 'lib/ is pure and must not import from server/.',
  },
  {
    target: './src/lib',
    from: './src/components',
    message: 'lib/ is pure and must not import from components/.',
  },
]

const eslintConfig = defineConfig([
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'drizzle/**',
    'eslint.config.mjs',
    'prettier.config.mjs',
    'postcss.config.mjs',
  ]),
  ...nextVitals,
  ...tseslint.configs.strictTypeChecked,
  {
    files: ['**/*.{ts,tsx,mjs,cjs,js,jsx}'],
    ignores: ['eslint.config.mjs', 'prettier.config.mjs', 'postcss.config.mjs'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
    rules: {
      'import/no-restricted-paths': ['error', { zones: layerBoundaryZones }],
      'import/no-cycle': 'error',
      'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/require-await': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'import/consistent-type-specifier-style': 'off',
    },
  },
  {
    files: ['src/app/**/*.{ts,tsx}', 'src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/server/db',
              message: 'Do not import the database layer from UI or route code.',
            },
            {
              name: '@/server/repositories',
              message: 'Do not import repositories from UI or route code.',
            },
            {
              name: '@/server/services',
              message: 'Do not import services from routes or UI. Use features/.',
            },
            {
              name: '@/server/auth',
              message: 'Do not import auth from routes or UI. Use features/.',
            },
          ],
          patterns: [
            {
              group: [
                '@/server/db/*',
                '@/server/repositories/*',
                '@/server/services/*',
                '@/server/auth/*',
                '@/server/errors/*',
                '@/server/cache/*',
              ],
              message: 'Do not import server layers from UI or route code.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/server/db',
              message: 'Do not import the database layer from features. Use server/services/.',
            },
            {
              name: '@/server/repositories',
              message: 'Do not import repositories from features. Use server/services/.',
            },
            {
              name: '@/server/auth',
              message: 'Do not import auth from features. Use server/services/.',
            },
          ],
          patterns: [
            {
              group: ['@/server/db/*', '@/server/repositories/*', '@/server/auth/*'],
              message: 'Do not import the database, repository, or auth layers from features.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/server/services/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'react', message: 'Services must not import React.' },
            { name: 'react-dom', message: 'Services must not import React DOM.' },
            { name: 'next/link', message: 'Services must not import Next.js UI modules.' },
            { name: 'next/navigation', message: 'Services must not import Next.js UI modules.' },
          ],
        },
      ],
    },
  },
  {
    files: ['src/server/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/explicit-module-boundary-types': 'error',
    },
  },
  {
    files: ['src/features/**/actions/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/explicit-module-boundary-types': 'error',
    },
  },
  {
    files: ['**/*.{test,spec}.{ts,tsx}', 'src/test/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.name='waitForTimeout']",
          message: 'Use assertion-driven auto-waiting instead of waitForTimeout.',
        },
      ],
    },
  },
  eslintConfigPrettier,
])

export default eslintConfig
