import { defineConfig, devices } from '@playwright/test'

const PORT = 3000
const baseURL = `http://127.0.0.1:${String(PORT)}`

export default defineConfig({
  testDir: './src/test/e2e',
  globalSetup: './src/test/e2e/global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
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
    command: 'pnpm start',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
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
