import { z } from 'zod'

function readEnv() {
  return {
    DATABASE_URL: process.env.assesment_TURSO_DATABASE_URL ?? process.env.DATABASE_URL,
    DATABASE_AUTH_TOKEN: process.env.assesment_TURSO_AUTH_TOKEN ?? process.env.DATABASE_AUTH_TOKEN,
    SESSION_PASSWORD: process.env.SESSION_PASSWORD,
    NODE_ENV: process.env.NODE_ENV,
  }
}

export const envSchema = z
  .object({
    DATABASE_URL: z.string().min(1).default('file:./data/app.db'),
    DATABASE_AUTH_TOKEN: z.string().min(1).optional(),
    SESSION_PASSWORD: z.string().min(32, 'SESSION_PASSWORD must be at least 32 characters'),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  })
  .superRefine((data, ctx) => {
    const remote =
      data.DATABASE_URL.startsWith('libsql:') ||
      data.DATABASE_URL.startsWith('https:') ||
      data.DATABASE_URL.startsWith('http:')

    if (remote && !data.DATABASE_AUTH_TOKEN) {
      ctx.addIssue({
        code: 'custom',
        message:
          'DATABASE_AUTH_TOKEN or TURSO_AUTH_TOKEN is required when DATABASE_URL points to Turso (libsql:// or https://).',
        path: ['DATABASE_AUTH_TOKEN'],
      })
    }
  })

export const env = envSchema.parse(readEnv())
