import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { AuthenticatedUser } from '@/server/auth/dal'
import type { AppDb } from '@/server/db/client'
import { requestActivities } from '@/server/db/schema'
import { getByReference, listRequestActivity } from '@/server/services/request.service'
import { createTestDb } from '@/test/db'
import type { TestDbContext } from '@/test/db'
import { insertRequest, insertSeedCategories, insertUser } from '@/test/factories'

const admin: AuthenticatedUser = {
  id: 'user_admin',
  name: 'Admin User',
  email: 'admin@assunnah.test',
  role: 'admin',
}

const agent: AuthenticatedUser = {
  id: 'user_agent',
  name: 'Agent User',
  email: 'agent@assunnah.test',
  role: 'agent',
}

const viewer: AuthenticatedUser = {
  id: 'user_viewer',
  name: 'Viewer User',
  email: 'viewer@assunnah.test',
  role: 'viewer',
}

describe('request.service getByReference', () => {
  let ctx: TestDbContext

  beforeEach(async () => {
    ctx = await createTestDb()
    globalThis.__drizzleDb = ctx.db as AppDb
    globalThis.__libsqlClient = ctx.client

    await insertUser(ctx.db, {
      id: 'user_admin',
      email: 'admin@assunnah.test',
      name: 'Admin User',
      role: 'admin',
    })
    await insertUser(ctx.db, {
      id: 'user_agent',
      email: 'agent@assunnah.test',
      name: 'Agent User',
      role: 'agent',
    })
    await insertUser(ctx.db, {
      id: 'user_viewer',
      email: 'viewer@assunnah.test',
      name: 'Viewer User',
      role: 'viewer',
    })
    await insertSeedCategories(ctx.db)
    await insertRequest(ctx.db, {
      id: 'req_assigned',
      reference: 'SR-2026-000142',
      subject: 'Laptop replacement for new staff member',
      description: 'Need a laptop for onboarding.',
      requesterId: 'user_viewer',
      assigneeId: 'user_agent',
      categoryId: 'cat_it_support',
    })
    await insertRequest(ctx.db, {
      id: 'req_other',
      reference: 'SR-2026-000200',
      subject: 'Unassigned facilities issue',
      requesterId: 'user_viewer',
      assigneeId: 'user_admin',
      categoryId: 'cat_general',
    })
  })

  afterEach(async () => {
    globalThis.__drizzleDb = undefined
    globalThis.__libsqlClient = undefined
    await ctx.dispose()
  })

  it('returns the request for users who can read all records', async () => {
    const request = await getByReference('SR-2026-000142', admin)

    expect(request).toMatchObject({
      reference: 'SR-2026-000142',
      subject: 'Laptop replacement for new staff member',
      description: 'Need a laptop for onboarding.',
      assignee: { id: 'user_agent', name: 'Agent User' },
      requester: { id: 'user_viewer', name: 'Viewer User' },
    })
  })

  it('returns an assigned request to the agent who owns it', async () => {
    const request = await getByReference('SR-2026-000142', agent)

    expect(request?.reference).toBe('SR-2026-000142')
  })

  it('hides out-of-scope and unknown references as not found', async () => {
    await expect(getByReference('SR-2026-000200', agent)).resolves.toBeNull()
    await expect(getByReference('SR-2099-999999', viewer)).resolves.toBeNull()
  })
})

describe('request.service listRequestActivity', () => {
  let ctx: TestDbContext

  beforeEach(async () => {
    ctx = await createTestDb()
    globalThis.__drizzleDb = ctx.db as AppDb
    globalThis.__libsqlClient = ctx.client

    await insertUser(ctx.db, {
      id: 'user_viewer',
      email: 'viewer@assunnah.test',
      name: 'Viewer User',
      role: 'viewer',
    })
    await insertSeedCategories(ctx.db)
    await insertRequest(ctx.db, {
      id: 'req_1',
      reference: 'SR-2026-000001',
      requesterId: 'user_viewer',
    })
    await ctx.db.insert(requestActivities).values([
      {
        id: 'act_2',
        requestId: 'req_1',
        actorId: 'user_viewer',
        type: 'commented',
        field: null,
        fromValue: null,
        toValue: null,
        comment: 'Follow-up note',
        idempotencyKey: null,
        createdAt: new Date('2026-01-01T11:00:00.000Z'),
      },
      {
        id: 'act_1',
        requestId: 'req_1',
        actorId: 'user_viewer',
        type: 'created',
        field: null,
        fromValue: null,
        toValue: null,
        comment: null,
        idempotencyKey: null,
        createdAt: new Date('2026-01-01T10:00:00.000Z'),
      },
    ])
  })

  afterEach(async () => {
    globalThis.__drizzleDb = undefined
    globalThis.__libsqlClient = undefined
    await ctx.dispose()
  })

  it('returns activity in chronological order', async () => {
    const timeline = await listRequestActivity('req_1')

    expect(timeline.map((entry) => entry.type)).toEqual(['created', 'commented'])
    expect(timeline[1]?.comment).toBe('Follow-up note')
  })
})
