import 'server-only'

import { and, asc, desc, eq, gt, lt, or } from 'drizzle-orm'
import type { SQL, SQLWrapper } from 'drizzle-orm'

import type { Cursor, SortKey } from '@/lib/search-params/cursor'
import { serviceRequests } from '@/server/db/schema'

type SortConfig = {
  readonly column: SQLWrapper
  readonly direction: 'asc' | 'desc'
  readonly cursorValue: (cursor: Cursor) => number
}

const SORT_CONFIG: Record<SortKey, SortConfig> = {
  updated_desc: {
    column: serviceRequests.updatedAt,
    direction: 'desc',
    cursorValue: (cursor) => Number(cursor.sortValue),
  },
  updated_asc: {
    column: serviceRequests.updatedAt,
    direction: 'asc',
    cursorValue: (cursor) => Number(cursor.sortValue),
  },
  created_desc: {
    column: serviceRequests.createdAt,
    direction: 'desc',
    cursorValue: (cursor) => Number(cursor.sortValue),
  },
  priority_desc: {
    column: serviceRequests.priorityRank,
    direction: 'desc',
    cursorValue: (cursor) => Number(cursor.sortValue),
  },
}

export function buildKeysetPredicate(sort: SortKey, cursor: Cursor): SQL | undefined {
  const config = SORT_CONFIG[sort]
  const rawValue = config.cursorValue(cursor)
  const sortValue =
    sort === 'updated_desc' || sort === 'updated_asc' || sort === 'created_desc'
      ? new Date(rawValue)
      : rawValue
  const idColumn = serviceRequests.id

  if (config.direction === 'desc') {
    return or(
      lt(config.column, sortValue),
      and(eq(config.column, sortValue), lt(idColumn, cursor.id)),
    )
  }

  return or(
    gt(config.column, sortValue),
    and(eq(config.column, sortValue), gt(idColumn, cursor.id)),
  )
}

export function buildSortOrder(sort: SortKey): [SQL, SQL] {
  const config = SORT_CONFIG[sort]
  const idOrder = config.direction === 'desc' ? desc(serviceRequests.id) : asc(serviceRequests.id)
  const columnOrder = config.direction === 'desc' ? desc(config.column) : asc(config.column)

  return [columnOrder, idOrder]
}
