import 'server-only'

import { asc, eq } from 'drizzle-orm'

import type { Db, DbExecutor } from '@/server/db/client'
import { getDb } from '@/server/db/client'
import { requestActivities, users } from '@/server/db/schema'
import type { ActivityType } from '@/server/db/schema'

export type ActivityInsert = {
  readonly id: string
  readonly requestId: string
  readonly actorId: string
  readonly type: ActivityType
  readonly field: string | null
  readonly fromValue: string | null
  readonly toValue: string | null
  readonly comment: string | null
  readonly idempotencyKey: string
  readonly createdAt: Date
}

export type ActivityListItem = {
  readonly id: string
  readonly requestId: string
  readonly type: ActivityType
  readonly field: string | null
  readonly fromValue: string | null
  readonly toValue: string | null
  readonly comment: string | null
  readonly createdAt: Date
  readonly actor: {
    readonly id: string
    readonly name: string
    readonly email: string
  }
}

export async function listActivitiesByRequestId(
  requestId: string,
  db: Db = getDb(),
): Promise<ActivityListItem[]> {
  const rows = await db
    .select({
      id: requestActivities.id,
      requestId: requestActivities.requestId,
      type: requestActivities.type,
      field: requestActivities.field,
      fromValue: requestActivities.fromValue,
      toValue: requestActivities.toValue,
      comment: requestActivities.comment,
      createdAt: requestActivities.createdAt,
      actorId: users.id,
      actorName: users.name,
      actorEmail: users.email,
    })
    .from(requestActivities)
    .innerJoin(users, eq(requestActivities.actorId, users.id))
    .where(eq(requestActivities.requestId, requestId))
    .orderBy(asc(requestActivities.createdAt))

  return rows.map((row) => ({
    id: row.id,
    requestId: row.requestId,
    type: row.type,
    field: row.field,
    fromValue: row.fromValue,
    toValue: row.toValue,
    comment: row.comment,
    createdAt: row.createdAt,
    actor: {
      id: row.actorId,
      name: row.actorName,
      email: row.actorEmail,
    },
  }))
}

export async function findByIdempotencyKey(
  key: string,
  db: Db = getDb(),
): Promise<{ requestId: string } | null> {
  const [row] = await db
    .select({ requestId: requestActivities.requestId })
    .from(requestActivities)
    .where(eq(requestActivities.idempotencyKey, key))
    .limit(1)

  return row ?? null
}

export async function insertActivity(
  activity: ActivityInsert,
  db: DbExecutor = getDb(),
): Promise<void> {
  await db.insert(requestActivities).values(activity)
}

export async function countActivitiesByRequestId(
  requestId: string,
  db: Db = getDb(),
): Promise<number> {
  const rows = await db
    .select({ id: requestActivities.id })
    .from(requestActivities)
    .where(eq(requestActivities.requestId, requestId))

  return rows.length
}
