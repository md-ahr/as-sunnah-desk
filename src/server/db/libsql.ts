import type { Config } from '@libsql/client'

import { env } from '@/server/env'

export function libsqlClientConfig(): Config {
  const config: Config = { url: env.DATABASE_URL }

  if (env.DATABASE_AUTH_TOKEN) {
    config.authToken = env.DATABASE_AUTH_TOKEN
  }

  return config
}
