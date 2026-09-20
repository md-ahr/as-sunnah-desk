import { execSync } from 'node:child_process'

export default function globalSetup(): void {
  execSync('pnpm db:reset', {
    stdio: 'inherit',
    env: {
      ...process.env,
      SESSION_PASSWORD:
        process.env.SESSION_PASSWORD ?? 'ci-session-password-at-least-32-chars-long',
      DATABASE_URL: process.env.DATABASE_URL ?? 'file:./data/app.db',
      NODE_ENV: 'test',
    } satisfies NodeJS.ProcessEnv,
  })
}
