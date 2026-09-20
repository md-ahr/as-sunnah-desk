import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['src/test/e2e/**', 'node_modules/**'],
    coverage: {
      thresholds: { lines: 80, functions: 80, branches: 75 },
      exclude: ['src/components/ui/**', '**/*.config.*', 'src/test/**'],
    },
  },
})
