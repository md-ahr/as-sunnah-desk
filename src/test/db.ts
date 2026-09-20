import { createClient } from '@libsql/client'
import type { Client } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'

import type { Db } from '@/server/db/client'
import * as schema from '@/server/db/schema'

export type TestDb = Db

export interface TestDbContext {
  db: TestDb
  client: Client
  dispose: () => Promise<void>
}

export async function createTestDb(): Promise<TestDbContext> {
  const client = createClient({ url: ':memory:' })
  const db = drizzle(client, { schema })
  await migrate(db, { migrationsFolder: './drizzle' })

  return {
    db,
    client,
    dispose: () => {
      client.close()
      return Promise.resolve()
    },
  }
}

export async function explainQuery(client: Client, sqlText: string, args: unknown[] = []) {
  return client.execute({ sql: `EXPLAIN QUERY PLAN ${sqlText}`, args: args as never[] })
}
