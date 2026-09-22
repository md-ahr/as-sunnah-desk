import 'server-only'

import { asc, eq, gt, inArray } from 'drizzle-orm'

import type { ActivityRecord } from '@/lib/summarize-activity'
import type { Db, DbExecutor } from '@/server/db/client'
import { getDb } from '@/server/db/client'
import { requestActivities, serviceRequests, users } from '@/server/db/schema'
import type { ActivityType, RequestStatus } from '@/server/db/schema'

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

function isAssigneeActivity(row: { field: string | null; type: ActivityType }): boolean {
  return row.field === 'assignee' || row.type === 'assigned' || row.type === 'unassigned'
}

function resolveAssigneeValue(
  value: string | null,
  namesById: ReadonlyMap<string, string>,
): string | null {
  if (value === null) {
    return null
  }

  return namesById.get(value) ?? value
}

async function listUserNamesByIds(
  ids: readonly string[],
  db: DbExecutor,
): Promise<Map<string, string>> {
  if (ids.length === 0) {
    return new Map()
  }

  const userRows = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(inArray(users.id, [...ids]))

  return new Map(userRows.map((row) => [row.id, row.name]))
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

  const assigneeIds = new Set<string>()
  for (const row of rows) {
    if (!isAssigneeActivity(row)) {
      continue
    }

    if (row.fromValue) {
      assigneeIds.add(row.fromValue)
    }
    if (row.toValue) {
      assigneeIds.add(row.toValue)
    }
  }

  const namesById = await listUserNamesByIds([...assigneeIds], db)

  return rows.map((row) => ({
    id: row.id,
    requestId: row.requestId,
    type: row.type,
    field: row.field,
    fromValue: isAssigneeActivity(row)
      ? resolveAssigneeValue(row.fromValue, namesById)
      : row.fromValue,
    toValue: isAssigneeActivity(row) ? resolveAssigneeValue(row.toValue, namesById) : row.toValue,
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

const ASSIGNMENT_STREAM_BATCH_SIZE = 1_000

type AssignmentStreamRow = {
  id: string
  assigneeId: string | null
  status: RequestStatus
  createdAt: Date
  resolvedAt: Date | null
}

export async function* streamAssignmentActivity(db: Db = getDb()): AsyncGenerator<ActivityRecord> {
  let cursor: string | null = null

  for (;;) {
    const rows: AssignmentStreamRow[] = await db
      .select({
        id: serviceRequests.id,
        assigneeId: serviceRequests.assigneeId,
        status: serviceRequests.status,
        createdAt: serviceRequests.createdAt,
        resolvedAt: serviceRequests.resolvedAt,
      })
      .from(serviceRequests)
      .where(cursor === null ? undefined : gt(serviceRequests.id, cursor))
      .orderBy(asc(serviceRequests.id))
      .limit(ASSIGNMENT_STREAM_BATCH_SIZE)

    if (rows.length === 0) {
      return
    }

    for (const row of rows) {
      yield {
        assigneeId: row.assigneeId,
        requestId: row.id,
        status: row.status,
        assignedAt: row.createdAt,
        resolvedAt: row.resolvedAt,
      }
    }

    const lastRow = rows.at(-1)
    if (lastRow === undefined) {
      return
    }
    cursor = lastRow.id
    if (rows.length < ASSIGNMENT_STREAM_BATCH_SIZE) {
      return
    }
  }
}
