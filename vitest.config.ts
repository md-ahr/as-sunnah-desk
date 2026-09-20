import path from 'node:path'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    alias: {
      'server-only': path.resolve('./src/test/mocks/server-only.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    env: {
      SESSION_PASSWORD: 'test-session-password-at-least-32-chars-long',
      DATABASE_URL: 'file:./data/app.db',
      NODE_ENV: 'test',
    },
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['src/test/e2e/**', 'node_modules/**'],
    coverage: {
      thresholds: { lines: 80, functions: 80, branches: 75 },
      exclude: ['src/components/ui/**', '**/*.config.*', 'src/test/**'],
    },
  },
})
