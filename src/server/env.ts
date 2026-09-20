import 'server-only'

import { z } from 'zod'

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1).default('file:./data/app.db'),
  SESSION_PASSWORD: z.string().min(32, 'SESSION_PASSWORD must be at least 32 characters'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
})

export const env = envSchema.parse(process.env)
