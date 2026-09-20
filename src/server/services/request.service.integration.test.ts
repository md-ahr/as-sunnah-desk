import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { Result } from '@/lib/result'
import type { AuthenticatedUser } from '@/server/auth/dal'
import type { AppDb } from '@/server/db/client'
import { requestActivities } from '@/server/db/schema'
import { countActivitiesByRequestId } from '@/server/repositories/activity.repository'
import {
  getByReference,
  listRequestActivity,
  updateAssignee,
  updateStatus,
} from '@/server/services/request.service'
import type {
  RequestUpdateResult,
  UpdateAssigneeInput,
  UpdateStatusInput,
} from '@/server/services/request-update.types'
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

describe('request.service updateStatus', () => {
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
      id: 'req_update',
      reference: 'SR-2026-000900',
      status: 'new',
      requesterId: 'user_admin',
      assigneeId: 'user_agent',
      categoryId: 'cat_it_support',
    })
  })

  afterEach(async () => {
    globalThis.__drizzleDb = undefined
    globalThis.__libsqlClient = undefined
    await ctx.dispose()
  })

  it('updates status, writes activity, and bumps version', async () => {
    const result: Result<RequestUpdateResult> = await updateStatus(
      admin,
      {
        id: 'req_update',
        status: 'in_review',
        version: 1,
        idempotencyKey: '11111111-1111-4111-8111-111111111111',
      } satisfies UpdateStatusInput,
    )

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.status).toBe('in_review')
      expect(result.data.version).toBe(2)
    }

    expect(await countActivitiesByRequestId('req_update', ctx.db)).toBe(1)
  })

  it('rejects invalid transitions', async () => {
    const result: Result<RequestUpdateResult> = await updateStatus(
      admin,
      {
        id: 'req_update',
        status: 'resolved',
        version: 1,
        idempotencyKey: '22222222-2222-4222-8222-222222222222',
      } satisfies UpdateStatusInput,
    )

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_TRANSITION')
    }
  })

  it('returns conflict when version is stale', async () => {
    const setupInput = {
      id: 'req_update',
      status: 'in_review',
      version: 1,
      idempotencyKey: '33333333-3333-4333-8333-333333333333',
    } satisfies UpdateStatusInput

    await updateStatus(admin, setupInput)

    const conflictInput = {
      id: 'req_update',
      status: 'rejected',
      version: 1,
      idempotencyKey: '44444444-4444-4444-8444-444444444444',
    } satisfies UpdateStatusInput

    const result: Result<RequestUpdateResult> = await updateStatus(admin, conflictInput)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('CONFLICT')
      expect(result.error.details?.currentVersion).toBe(2)
      expect(result.error.details?.currentStatus).toBe('in_review')
    }
  })

  it('allows assigned agents to update their requests', async () => {
    const result: Result<RequestUpdateResult> = await updateStatus(
      agent,
      {
        id: 'req_update',
        status: 'in_review',
        version: 1,
        idempotencyKey: '77777777-7777-4777-8777-777777777777',
      } satisfies UpdateStatusInput,
    )

    expect(result.ok).toBe(true)
  })

  it('rejects viewers and out-of-scope agents', async () => {
    await insertRequest(ctx.db, {
      id: 'req_other',
      reference: 'SR-2026-000905',
      status: 'new',
      requesterId: 'user_admin',
      assigneeId: 'user_admin',
      categoryId: 'cat_general',
    })

    const viewerResult: Result<RequestUpdateResult> = await updateStatus(
      viewer,
      {
        id: 'req_update',
        status: 'in_review',
        version: 1,
        idempotencyKey: '88888888-8888-4888-8888-888888888888',
      } satisfies UpdateStatusInput,
    )
    const agentResult: Result<RequestUpdateResult> = await updateStatus(
      agent,
      {
        id: 'req_other',
        status: 'in_review',
        version: 1,
        idempotencyKey: '99999999-9999-4999-8999-999999999999',
      } satisfies UpdateStatusInput,
    )

    expect(viewerResult.ok).toBe(false)
    expect(agentResult.ok).toBe(false)
    if (!viewerResult.ok) expect(viewerResult.error.code).toBe('FORBIDDEN')
    if (!agentResult.ok) expect(agentResult.error.code).toBe('FORBIDDEN')
  })

  it('replays the same idempotency key without a second write', async () => {
    const input: UpdateStatusInput = {
      id: 'req_update',
      status: 'in_review',
      version: 1,
      idempotencyKey: '55555555-5555-4555-8555-555555555555',
    }

    const first = await updateStatus(admin, input)
    const second = await updateStatus(admin, input)

    expect(first.ok).toBe(true)
    expect(second.ok).toBe(true)
    expect(await countActivitiesByRequestId('req_update', ctx.db)).toBe(1)
  })

  it('sets resolved_at when transitioning to resolved', async () => {
    await insertRequest(ctx.db, {
      id: 'req_resolve',
      reference: 'SR-2026-000906',
      status: 'in_progress',
      requesterId: 'user_admin',
      assigneeId: 'user_agent',
      categoryId: 'cat_it_support',
    })

    const result: Result<RequestUpdateResult> = await updateStatus(admin, {
      id: 'req_resolve',
      status: 'resolved',
      version: 1,
      idempotencyKey: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.status).toBe('resolved')
      expect(result.data.resolvedAt).toBeInstanceOf(Date)
    }
  })
})

describe('request.service updateAssignee', () => {
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
      id: 'user_manager',
      email: 'manager@assunnah.test',
      name: 'Manager User',
      role: 'manager',
    })
    await insertSeedCategories(ctx.db)
    await insertRequest(ctx.db, {
      id: 'req_assign',
      reference: 'SR-2026-000901',
      status: 'new',
      requesterId: 'user_admin',
      assigneeId: null,
      categoryId: 'cat_general',
    })
  })

  afterEach(async () => {
    globalThis.__drizzleDb = undefined
    globalThis.__libsqlClient = undefined
    await ctx.dispose()
  })

  it('assigns a request and records activity', async () => {
    const result: Result<RequestUpdateResult> = await updateAssignee(
      admin,
      {
        id: 'req_assign',
        assigneeId: 'user_manager',
        version: 1,
        idempotencyKey: '66666666-6666-4666-8666-666666666666',
      } satisfies UpdateAssigneeInput,
    )

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.assignee).toEqual({ id: 'user_manager', name: 'Manager User' })
      expect(result.data.version).toBe(2)
    }
  })

  it('returns conflict when version is stale', async () => {
    await updateAssignee(admin, {
      id: 'req_assign',
      assigneeId: 'user_manager',
      version: 1,
      idempotencyKey: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    })

    const result: Result<RequestUpdateResult> = await updateAssignee(admin, {
      id: 'req_assign',
      assigneeId: 'user_admin',
      version: 1,
      idempotencyKey: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('CONFLICT')
      expect(result.error.details?.currentVersion).toBe(2)
    }
  })

  it('replays the same idempotency key without a second write', async () => {
    const input: UpdateAssigneeInput = {
      id: 'req_assign',
      assigneeId: 'user_manager',
      version: 1,
      idempotencyKey: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    }

    const first = await updateAssignee(admin, input)
    const second = await updateAssignee(admin, input)

    expect(first.ok).toBe(true)
    expect(second.ok).toBe(true)
    expect(await countActivitiesByRequestId('req_assign', ctx.db)).toBe(1)
  })

  it('rejects agents assigning to someone else', async () => {
    await insertRequest(ctx.db, {
      id: 'req_agent_assign',
      reference: 'SR-2026-000907',
      status: 'new',
      requesterId: 'user_admin',
      assigneeId: 'user_agent',
      categoryId: 'cat_general',
    })

    const result: Result<RequestUpdateResult> = await updateAssignee(agent, {
      id: 'req_agent_assign',
      assigneeId: 'user_manager',
      version: 1,
      idempotencyKey: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('FORBIDDEN')
    }
  })
})
