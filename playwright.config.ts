import { defineConfig, devices } from '@playwright/test'

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3001)
const baseURL = `http://127.0.0.1:${String(PORT)}`

export default defineConfig({
  testDir: './src/test/e2e',
  globalSetup: './src/test/e2e/global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // All specs share one SQLite file (global-setup); parallel workers race on writes.
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `pnpm start --port ${String(PORT)}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      SESSION_PASSWORD:
        process.env.SESSION_PASSWORD ?? 'ci-session-password-at-least-32-chars-long',
      DATABASE_URL: process.env.DATABASE_URL ?? 'file:./data/app.db',
    },
  },
})
