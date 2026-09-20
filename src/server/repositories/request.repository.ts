import 'server-only'

import { and, eq, inArray, isNull, or, sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'

import { cursorFromRow, decodeCursor, encodeCursor } from '@/lib/search-params/cursor'
import type { Cursor, SortKey } from '@/lib/search-params/cursor'
import type { AppDb, Db } from '@/server/db/client'
import { getDb } from '@/server/db/client'
import { categories, serviceRequests, users } from '@/server/db/schema'
import type { RequestPriority, RequestStatus } from '@/server/db/schema'
import { alias } from 'drizzle-orm/sqlite-core'
import { buildKeysetPredicate, buildSortOrder } from '@/server/repositories/request-keyset'

export type RequestFilters = {
  readonly statuses: readonly RequestStatus[]
  readonly priorities: readonly RequestPriority[]
  readonly categoryIds: readonly string[]
  readonly assigneeIds: readonly string[]
  readonly query: string | null
  readonly sort: SortKey
}

export type RequestListItem = {
  readonly id: string
  readonly reference: string
  readonly subject: string
  readonly priority: RequestPriority
  readonly status: RequestStatus
  readonly updatedAt: Date
  readonly requester: {
    readonly id: string
    readonly name: string
    readonly email: string
  }
  readonly category: {
    readonly id: string
    readonly name: string
    readonly slug: string
  }
  readonly assignee: {
    readonly id: string
    readonly name: string
  } | null
}

export type RequestDetail = RequestListItem & {
  readonly description: string
  readonly createdAt: Date
  readonly resolvedAt: Date | null
  readonly version: number
}

export type PageResult<T> = {
  readonly items: readonly T[]
  readonly nextCursor: string | null
  readonly hasNextPage: boolean
}

const assigneeUser = alias(users, 'assignee')

function assigneePredicate(assigneeIds: readonly string[]): SQL | undefined {
  const includesUnassigned = assigneeIds.includes('unassigned')
  const userIds = assigneeIds.filter((id) => id !== 'unassigned')

  if (includesUnassigned && userIds.length > 0) {
    return or(isNull(serviceRequests.assigneeId), inArray(serviceRequests.assigneeId, userIds))
  }

  if (includesUnassigned) {
    return isNull(serviceRequests.assigneeId)
  }

  if (userIds.length > 0) {
    return inArray(serviceRequests.assigneeId, userIds)
  }

  return undefined
}

function escapeFtsQuery(query: string): string {
  return query
    .trim()
    .replace(/["']/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((term) => `"${term}"*`)
    .join(' AND ')
}

async function ftsMatchIds(db: Db, query: string): Promise<string[]> {
  const ftsQuery = escapeFtsQuery(query)
  if (!ftsQuery) {
    return []
  }

  try {
    const rows = await db.all<{ id: string }>(sql`
      SELECT service_requests.id AS id
      FROM requests_fts
      JOIN service_requests ON service_requests.rowid = requests_fts.rowid
      WHERE requests_fts MATCH ${ftsQuery}
    `)

    return rows.map((row) => row.id)
  } catch {
    const pattern = `%${query.trim()}%`
    const rows = await db
      .select({ id: serviceRequests.id })
      .from(serviceRequests)
      .where(
        or(
          sql`${serviceRequests.subject} LIKE ${pattern}`,
          sql`${serviceRequests.reference} LIKE ${pattern}`,
        ),
      )

    return rows.map((row) => row.id)
  }
}

function buildWhereClause(
  filters: RequestFilters,
  cursor: Cursor | null,
  ftsIds: string[] | null,
): SQL | undefined {
  const predicates = [
    filters.statuses.length > 0
      ? inArray(serviceRequests.status, [...filters.statuses])
      : undefined,
    filters.priorities.length > 0
      ? inArray(serviceRequests.priority, [...filters.priorities])
      : undefined,
    filters.categoryIds.length > 0
      ? inArray(serviceRequests.categoryId, [...filters.categoryIds])
      : undefined,
    filters.assigneeIds.length > 0 ? assigneePredicate(filters.assigneeIds) : undefined,
    filters.query && ftsIds !== null
      ? ftsIds.length > 0
        ? inArray(serviceRequests.id, ftsIds)
        : sql`0 = 1`
      : undefined,
    cursor ? buildKeysetPredicate(filters.sort, cursor) : undefined,
  ].filter((predicate): predicate is SQL => predicate !== undefined)

  if (predicates.length === 0) {
    return undefined
  }

  return and(...predicates)
}

export async function listPaged(
  db: Db,
  filters: RequestFilters,
  cursorToken: string | null,
  limit: number,
): Promise<PageResult<RequestListItem>> {
  const sort = filters.sort
  const cursor = cursorToken ? decodeCursor(cursorToken) : null
  const ftsIds = filters.query ? await ftsMatchIds(db, filters.query) : null
  const whereClause = buildWhereClause(filters, cursor, ftsIds)
  const orderBy = buildSortOrder(sort)

  const rows = await db
    .select({
      id: serviceRequests.id,
      reference: serviceRequests.reference,
      subject: serviceRequests.subject,
      priority: serviceRequests.priority,
      status: serviceRequests.status,
      updatedAt: serviceRequests.updatedAt,
      createdAt: serviceRequests.createdAt,
      priorityRank: serviceRequests.priorityRank,
      requesterId: users.id,
      requesterName: users.name,
      requesterEmail: users.email,
      categoryId: categories.id,
      categoryName: categories.name,
      categorySlug: categories.slug,
      assigneeId: assigneeUser.id,
      assigneeName: assigneeUser.name,
    })
    .from(serviceRequests)
    .innerJoin(users, eq(serviceRequests.requesterId, users.id))
    .innerJoin(categories, eq(serviceRequests.categoryId, categories.id))
    .leftJoin(assigneeUser, eq(serviceRequests.assigneeId, assigneeUser.id))
    .where(whereClause)
    .orderBy(...orderBy)
    .limit(limit + 1)

  const hasNextPage = rows.length > limit
  const pageRows = hasNextPage ? rows.slice(0, limit) : rows

  const items: RequestListItem[] = pageRows.map((row) => ({
    id: row.id,
    reference: row.reference,
    subject: row.subject,
    priority: row.priority,
    status: row.status,
    updatedAt: row.updatedAt,
    requester: {
      id: row.requesterId,
      name: row.requesterName,
      email: row.requesterEmail,
    },
    category: {
      id: row.categoryId,
      name: row.categoryName,
      slug: row.categorySlug,
    },
    assignee:
      row.assigneeId && row.assigneeName ? { id: row.assigneeId, name: row.assigneeName } : null,
  }))

  const lastRow = pageRows.at(-1)
  const nextCursor =
    hasNextPage && lastRow
      ? encodeCursor(
          cursorFromRow(sort, {
            id: lastRow.id,
            updatedAt: lastRow.updatedAt,
            createdAt: lastRow.createdAt,
            priorityRank: lastRow.priorityRank,
          }),
        )
      : null

  return {
    items,
    nextCursor,
    hasNextPage,
  }
}

export async function getByReference(
  reference: string,
  db: Db = getDb(),
): Promise<RequestDetail | null> {
  const [row] = await db
    .select({
      id: serviceRequests.id,
      reference: serviceRequests.reference,
      subject: serviceRequests.subject,
      description: serviceRequests.description,
      priority: serviceRequests.priority,
      status: serviceRequests.status,
      updatedAt: serviceRequests.updatedAt,
      createdAt: serviceRequests.createdAt,
      resolvedAt: serviceRequests.resolvedAt,
      version: serviceRequests.version,
      requesterId: users.id,
      requesterName: users.name,
      requesterEmail: users.email,
      categoryId: categories.id,
      categoryName: categories.name,
      categorySlug: categories.slug,
      assigneeId: assigneeUser.id,
      assigneeName: assigneeUser.name,
    })
    .from(serviceRequests)
    .innerJoin(users, eq(serviceRequests.requesterId, users.id))
    .innerJoin(categories, eq(serviceRequests.categoryId, categories.id))
    .leftJoin(assigneeUser, eq(serviceRequests.assigneeId, assigneeUser.id))
    .where(eq(serviceRequests.reference, reference))
    .limit(1)

  if (!row) {
    return null
  }

  return {
    id: row.id,
    reference: row.reference,
    subject: row.subject,
    description: row.description,
    priority: row.priority,
    status: row.status,
    updatedAt: row.updatedAt,
    createdAt: row.createdAt,
    resolvedAt: row.resolvedAt,
    version: row.version,
    requester: {
      id: row.requesterId,
      name: row.requesterName,
      email: row.requesterEmail,
    },
    category: {
      id: row.categoryId,
      name: row.categoryName,
      slug: row.categorySlug,
    },
    assignee:
      row.assigneeId && row.assigneeName ? { id: row.assigneeId, name: row.assigneeName } : null,
  }
}

export async function explainListQueryPlan(db: Db, filters: RequestFilters): Promise<string> {
  const whereClause = buildWhereClause(filters, null, null)
  const orderBy = buildSortOrder(filters.sort)
  const built = db
    .select({ id: serviceRequests.id })
    .from(serviceRequests)
    .where(whereClause)
    .orderBy(...orderBy)
    .limit(26)
    .toSQL()

  const result = await (db as AppDb).$client.execute({
    sql: `EXPLAIN QUERY PLAN ${built.sql}`,
    args: built.params as (string | number | bigint | boolean | null)[],
  })

  return result.rows.map((row: Record<string, unknown>) => String(row[3])).join('\n')
}
