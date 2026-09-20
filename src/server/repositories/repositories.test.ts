import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { listActivitiesByRequestId } from '@/server/repositories/activity.repository'
import {
  findActiveUserById,
  findPublicUserById,
  findUserByEmail,
  findUserById,
} from '@/server/repositories/user.repository'
import { listAssignableUsers, listCategories } from '@/server/repositories/reference.repository'
import { createTestDb } from '@/test/db'
import type { TestDbContext } from '@/test/db'
import { insertRequest, insertSeedCategories, insertUser } from '@/test/factories'
import { requestActivities } from '@/server/db/schema'

describe('reference and user repositories', () => {
  let ctx: TestDbContext

  beforeEach(async () => {
    ctx = await createTestDb()
    await insertUser(ctx.db, {
      id: 'user_admin',
      email: 'admin@assunnah.test',
      name: 'Admin User',
      role: 'admin',
    })
    await insertUser(ctx.db, {
      id: 'user_viewer',
      email: 'viewer@assunnah.test',
      name: 'Viewer User',
      role: 'viewer',
    })
    await insertSeedCategories(ctx.db)
  })

  afterEach(async () => {
    await ctx.dispose()
  })

  it('lists active categories in sort order', async () => {
    const categories = await listCategories(ctx.db)

    expect(categories.map((category) => category.slug)).toEqual(['it-support', 'general'])
  })

  it('lists assignable users without viewers', async () => {
    const assignable = await listAssignableUsers(ctx.db)

    expect(assignable.map((user) => user.id)).toEqual(['user_admin'])
  })

  it('finds users by id and email without exposing extra columns', async () => {
    const byId = await findUserById('user_admin', ctx.db)
    const byEmail = await findUserByEmail('admin@assunnah.test', ctx.db)
    const activeUser = await findActiveUserById('user_admin', ctx.db)
    const publicUser = await findPublicUserById('user_admin', ctx.db)

    expect(byId).toMatchObject({ id: 'user_admin', role: 'admin', passwordHash: 'hashed-password' })
    expect(byEmail?.id).toBe('user_admin')
    expect(activeUser).toMatchObject({ id: 'user_admin', role: 'admin' })
    expect(activeUser).not.toHaveProperty('passwordHash')
    expect(publicUser).toMatchObject({ id: 'user_admin', role: 'admin' })
    expect(publicUser).not.toHaveProperty('passwordHash')
  })
})

describe('activity.repository integration', () => {
  let ctx: TestDbContext

  beforeEach(async () => {
    ctx = await createTestDb()
    await insertUser(ctx.db, { id: 'user_viewer', role: 'viewer', name: 'Viewer User' })
    await insertSeedCategories(ctx.db)
    await insertRequest(ctx.db, {
      id: 'req_1',
      reference: 'SR-2026-000001',
      requesterId: 'user_viewer',
    })
    await ctx.db.insert(requestActivities).values([
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
    ])
  })

  afterEach(async () => {
    await ctx.dispose()
  })

  it('returns activity rows in chronological order with actor details', async () => {
    const timeline = await listActivitiesByRequestId('req_1', ctx.db)

    expect(timeline.map((entry) => entry.type)).toEqual(['created', 'commented'])
    expect(timeline[1]?.actor.name).toBe('Viewer User')
  })
})
