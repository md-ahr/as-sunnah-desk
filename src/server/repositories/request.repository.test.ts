import { sql } from 'drizzle-orm'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { DEFAULT_SORT } from '@/lib/search-params/cursor'
import { serviceRequests } from '@/server/db/schema'
import {
  explainListQueryPlan,
  getByReference,
  listPaged,
} from '@/server/repositories/request.repository'
import type { RequestFilters } from '@/server/repositories/request.repository'
import { createTestDb, explainQuery } from '@/test/db'
import type { TestDbContext } from '@/test/db'
import { insertRequest, insertRequests, insertSeedCategories, insertUser } from '@/test/factories'

const defaultFilters: RequestFilters = {
  statuses: [],
  priorities: [],
  categoryIds: [],
  assigneeIds: [],
  query: null,
  sort: DEFAULT_SORT,
}

function assertIndexBackedPlan(plan: string): void {
  const normalized = plan.toLowerCase()
  const hasFullTableScan =
    normalized.includes('scan service_requests') &&
    !normalized.includes('using covering index') &&
    !normalized.includes('using index')

  expect(hasFullTableScan).toBe(false)
}

describe('request.repository integration', () => {
  let ctx: TestDbContext

  beforeEach(async () => {
    ctx = await createTestDb()
    await insertUser(ctx.db, {
      id: 'user_viewer',
      email: 'viewer@assunnah.test',
      name: 'Viewer User',
      role: 'viewer',
    })
    await insertUser(ctx.db, {
      id: 'user_agent',
      email: 'agent@assunnah.test',
      name: 'Agent User',
      role: 'agent',
    })
    await insertSeedCategories(ctx.db)
  })

  afterEach(async () => {
    await ctx.dispose()
  })

  it('returns a request by reference with joined DTO fields', async () => {
    await insertRequest(ctx.db, {
      reference: 'SR-2026-000142',
      subject: 'Laptop replacement for new staff member',
      requesterId: 'user_viewer',
      assigneeId: 'user_agent',
      categoryId: 'cat_it_support',
    })

    const request = await getByReference('SR-2026-000142', ctx.db)

    expect(request).toMatchObject({
      reference: 'SR-2026-000142',
      subject: 'Laptop replacement for new staff member',
      requester: { id: 'user_viewer', name: 'Viewer User' },
      assignee: { id: 'user_agent', name: 'Agent User' },
      category: { slug: 'it-support', name: 'IT Support' },
    })
  })

  it('paginates 12,000 rows with no gaps or duplicates', async () => {
    await insertRequests(ctx.db, 12_000, { requesterId: 'user_viewer' })

    const seen = new Set<string>()
    let cursor: string | null = null
    let pageCount = 0

    do {
      const page = await listPaged(ctx.db, defaultFilters, cursor, 25)
      pageCount += 1

      for (const row of page.items) {
        expect(seen.has(row.id)).toBe(false)
        seen.add(row.id)
      }

      cursor = page.nextCursor
    } while (cursor)

    expect(seen.size).toBe(12_000)
    expect(pageCount).toBe(480)
  })

  it('avoids duplicate rows when a newer record is inserted mid-pagination', async () => {
    await insertRequests(ctx.db, 200, { requesterId: 'user_viewer' })

    const firstPage = await listPaged(ctx.db, defaultFilters, null, 50)
    expect(firstPage.nextCursor).toBeTruthy()

    await insertRequest(ctx.db, {
      reference: 'SR-2026-999999',
      subject: 'Inserted during pagination',
      requesterId: 'user_viewer',
      createdAt: new Date(Date.now() + 86_400_000),
      updatedAt: new Date(Date.now() + 86_400_000),
    })

    const seen = new Set(firstPage.items.map((row) => row.id))
    let cursor = firstPage.nextCursor

    while (cursor) {
      const page = await listPaged(ctx.db, defaultFilters, cursor, 50)
      for (const row of page.items) {
        expect(seen.has(row.id)).toBe(false)
        seen.add(row.id)
      }
      cursor = page.nextCursor
    }

    expect(seen.size).toBe(200)
  })

  it('uses an index-backed plan for the default list query', async () => {
    await insertRequests(ctx.db, 500, { requesterId: 'user_viewer' })

    const plan = await explainListQueryPlan(ctx.db, defaultFilters)

    assertIndexBackedPlan(plan)
  })

  it('uses an index-backed plan for filtered list queries', async () => {
    await insertRequests(ctx.db, 500, {
      requesterId: 'user_viewer',
      status: 'in_progress',
      assigneeId: 'user_agent',
    })

    const built = ctx.db
      .select({ id: serviceRequests.id })
      .from(serviceRequests)
      .where(
        sql`${serviceRequests.status} = 'in_progress' AND ${serviceRequests.assigneeId} = 'user_agent'`,
      )
      .orderBy(sql`${serviceRequests.updatedAt} DESC`, sql`${serviceRequests.id} DESC`)
      .limit(26)
      .toSQL()

    const plan = await explainQuery(ctx.client, built.sql, [...built.params])
    const detail = plan.rows
      .map((row) => {
        const value = row[3]
        return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
      })
      .join('\n')
      .toLowerCase()

    assertIndexBackedPlan(detail)
  })

  it('finds FTS matches for subject terms', async () => {
    await insertRequest(ctx.db, {
      reference: 'SR-2026-000500',
      subject: 'Requesting laptop upgrade for remote work',
      description: 'Needs a faster machine for development workloads.',
      requesterId: 'user_viewer',
    })
    await ctx.db.run(sql`INSERT INTO requests_fts(requests_fts) VALUES ('rebuild')`)

    const page = await listPaged(ctx.db, { ...defaultFilters, query: 'laptop' }, null, 10)

    expect(page.items.some((row) => row.reference === 'SR-2026-000500')).toBe(true)
  })

  it('composes status, priority, and category filters', async () => {
    await insertRequest(ctx.db, {
      reference: 'SR-2026-000020',
      requesterId: 'user_viewer',
      status: 'new',
      priority: 'urgent',
      categoryId: 'cat_it_support',
    })
    await insertRequest(ctx.db, {
      reference: 'SR-2026-000021',
      requesterId: 'user_viewer',
      status: 'closed',
      priority: 'urgent',
      categoryId: 'cat_it_support',
    })

    const page = await listPaged(
      ctx.db,
      {
        ...defaultFilters,
        statuses: ['new'],
        priorities: ['urgent'],
        categoryIds: ['cat_it_support'],
      },
      null,
      10,
    )

    expect(page.items.map((row) => row.reference)).toEqual(['SR-2026-000020'])
  })

  it('paginates with whitelisted sort keys', async () => {
    await insertRequest(ctx.db, {
      reference: 'SR-2026-000030',
      requesterId: 'user_viewer',
      priority: 'low',
      createdAt: new Date('2026-01-01T10:00:00.000Z'),
      updatedAt: new Date('2026-01-03T10:00:00.000Z'),
    })
    await insertRequest(ctx.db, {
      reference: 'SR-2026-000031',
      requesterId: 'user_viewer',
      priority: 'urgent',
      createdAt: new Date('2026-01-02T10:00:00.000Z'),
      updatedAt: new Date('2026-01-01T10:00:00.000Z'),
    })

    const byPriority = await listPaged(
      ctx.db,
      { ...defaultFilters, sort: 'priority_desc' },
      null,
      10,
    )
    const byCreated = await listPaged(ctx.db, { ...defaultFilters, sort: 'created_desc' }, null, 10)

    expect(byPriority.items.map((row) => row.reference)).toEqual([
      'SR-2026-000031',
      'SR-2026-000030',
    ])
    expect(byCreated.items.map((row) => row.reference)).toEqual([
      'SR-2026-000031',
      'SR-2026-000030',
    ])
  })

  it('matches Porter-stemmed FTS queries', async () => {
    await insertRequest(ctx.db, {
      reference: 'SR-2026-000600',
      subject: 'Requesting annual leave approval',
      description: 'Need time off next month.',
      requesterId: 'user_viewer',
    })
    await ctx.db.run(sql`INSERT INTO requests_fts(requests_fts) VALUES ('rebuild')`)

    const page = await listPaged(ctx.db, { ...defaultFilters, query: 'request' }, null, 10)

    expect(page.items.some((row) => row.reference === 'SR-2026-000600')).toBe(true)
  })

  it('re-paginates the full result set after a concurrent insert without duplicates', async () => {
    await insertRequests(ctx.db, 300, { requesterId: 'user_viewer' })

    const collectAllIds = async (): Promise<string[]> => {
      const ids: string[] = []
      let cursor: string | null = null

      do {
        const page = await listPaged(ctx.db, defaultFilters, cursor, 40)
        ids.push(...page.items.map((row) => row.id))
        cursor = page.nextCursor
      } while (cursor)

      return ids
    }

    const beforeInsert = await collectAllIds()
    expect(beforeInsert).toHaveLength(300)

    await insertRequest(ctx.db, {
      reference: 'SR-2026-999001',
      subject: 'Inserted concurrently',
      requesterId: 'user_viewer',
      createdAt: new Date('2026-01-15T12:00:00.000Z'),
      updatedAt: new Date('2026-01-15T12:00:00.000Z'),
    })

    const afterInsert = await collectAllIds()
    expect(new Set(afterInsert).size).toBe(301)
    expect(afterInsert).toHaveLength(301)
  })

  it('does not expose description on list items', async () => {
    await insertRequest(ctx.db, {
      reference: 'SR-2026-000700',
      subject: 'Visible subject',
      description: 'Hidden description payload',
      requesterId: 'user_viewer',
    })

    const page = await listPaged(ctx.db, defaultFilters, null, 10)

    expect(page.items[0]).toMatchObject({ subject: 'Visible subject' })
    expect(page.items[0]).not.toHaveProperty('description')
  })

  it('composes assignee filters including unassigned', async () => {
    await insertRequest(ctx.db, {
      reference: 'SR-2026-000010',
      requesterId: 'user_viewer',
      assigneeId: null,
    })
    await insertRequest(ctx.db, {
      reference: 'SR-2026-000011',
      requesterId: 'user_viewer',
      assigneeId: 'user_agent',
    })

    const unassigned = await listPaged(
      ctx.db,
      { ...defaultFilters, assigneeIds: ['unassigned'] },
      null,
      10,
    )
    const assigned = await listPaged(
      ctx.db,
      { ...defaultFilters, assigneeIds: ['user_agent'] },
      null,
      10,
    )

    expect(unassigned.items.map((row) => row.reference)).toEqual(['SR-2026-000010'])
    expect(assigned.items.map((row) => row.reference)).toEqual(['SR-2026-000011'])
  })
})
