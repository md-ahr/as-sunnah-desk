import { defineConfig } from 'drizzle-kit'

const url =
  process.env.assesment_TURSO_DATABASE_URL ?? process.env.DATABASE_URL ?? 'file:./data/app.db'
const authToken = process.env.assesment_TURSO_AUTH_TOKEN ?? process.env.DATABASE_AUTH_TOKEN
const isTurso = url.startsWith('libsql:') || Boolean(authToken)

const shared = {
  schema: './src/server/db/schema.ts',
  out: './drizzle',
}

export default defineConfig(
  isTurso
    ? {
        ...shared,
        dialect: 'turso',
        dbCredentials: {
          url,
          authToken,
        },
      }
    : {
        ...shared,
        dialect: 'sqlite',
        dbCredentials: {
          url,
        },
      },
)
