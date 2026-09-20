import 'server-only'

import { createClient } from '@libsql/client'
import type { Client } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'

import { env } from '@/server/env'
import * as schema from '@/server/db/schema'

export type Db = LibSQLDatabase<typeof schema>
export type AppDb = Db & {
  readonly $client: Client
}

export type DbExecutor = Pick<Db, 'select' | 'insert' | 'update' | 'delete' | 'all' | 'run'>

declare global {
  var __libsqlClient: Client | undefined

  var __drizzleDb: AppDb | undefined
}

function createLibsqlClient(): Client {
  return createClient({ url: env.DATABASE_URL })
}

function getClient(): Client {
  globalThis.__libsqlClient ??= createLibsqlClient()
  return globalThis.__libsqlClient
}

export function getDb(): AppDb {
  globalThis.__drizzleDb ??= drizzle(getClient(), { schema }) as AppDb
  return globalThis.__drizzleDb
}
