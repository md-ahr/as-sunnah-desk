import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { hashPassword } from '@/server/auth/password'
import { resetLoginRateLimits } from '@/server/auth/rate-limit'
import * as session from '@/server/auth/session'
import type { AppDb } from '@/server/db/client'
import { loginWithCredentials } from '@/server/services/auth.service'
import { createTestDb } from '@/test/db'
import type { TestDbContext } from '@/test/db'
import { insertUser } from '@/test/factories'

const TEST_IP = '203.0.113.10'

describe('auth.service loginWithCredentials integration', () => {
  let ctx: TestDbContext

  beforeEach(async () => {
    ctx = await createTestDb()
    globalThis.__drizzleDb = ctx.db as AppDb
    globalThis.__libsqlClient = ctx.client

    const passwordHash = await hashPassword('test.agent')

    await insertUser(ctx.db, {
      id: 'user_agent',
      email: 'agent@assunnah.test',
      name: 'Agent User',
      role: 'agent',
      passwordHash,
    })

    vi.spyOn(session, 'createSession').mockResolvedValue(undefined)
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    resetLoginRateLimits()
    globalThis.__drizzleDb = undefined
    globalThis.__libsqlClient = undefined
    await ctx.dispose()
  })

  it('authenticates valid credentials against the database', async () => {
    const result = await loginWithCredentials(
      {
        email: 'agent@assunnah.test',
        password: 'test.agent',
        next: '/requests',
      },
      TEST_IP,
    )

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data).toEqual({ userId: 'user_agent', next: '/requests' })
    }
    expect(session.createSession).toHaveBeenCalledWith('user_agent')
  })

  it('rejects an incorrect password with a generic unauthorized error', async () => {
    const result = await loginWithCredentials(
      {
        email: 'agent@assunnah.test',
        password: 'wrong-password',
        next: '/requests',
      },
      TEST_IP,
    )

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toEqual({
        code: 'UNAUTHORIZED',
        message: 'Invalid email or password.',
      })
    }
    expect(session.createSession).not.toHaveBeenCalled()
  })

  it('rejects unknown emails without revealing account existence', async () => {
    const result = await loginWithCredentials(
      {
        email: 'missing@assunnah.test',
        password: 'test.agent',
        next: '/requests',
      },
      TEST_IP,
    )

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'Invalid email or password.',
      })
    }
  })

  it('rejects inactive users', async () => {
    const passwordHash = await hashPassword('test.viewer')

    await insertUser(ctx.db, {
      id: 'user_inactive',
      email: 'inactive@assunnah.test',
      name: 'Inactive User',
      role: 'viewer',
      passwordHash,
      isActive: false,
    })

    const result = await loginWithCredentials(
      {
        email: 'inactive@assunnah.test',
        password: 'test.viewer',
        next: '/requests',
      },
      TEST_IP,
    )

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('UNAUTHORIZED')
    }
  })

  it('returns validation errors for malformed input', async () => {
    const result = await loginWithCredentials(
      {
        email: '',
        password: '',
        next: '/requests',
      },
      TEST_IP,
    )

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION')
      if ('fields' in result.error) {
        expect(result.error.fields.email?.[0]).toBeTruthy()
        expect(result.error.fields.password?.[0]).toBeTruthy()
      }
    }
  })

  it('rate-limits the sixth failed attempt for the same IP and email', async () => {
    const credentials = {
      email: 'agent@assunnah.test',
      password: 'wrong-password',
      next: '/requests',
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const result = await loginWithCredentials(credentials, TEST_IP)
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe('UNAUTHORIZED')
      }
    }

    const sixth = await loginWithCredentials(credentials, TEST_IP)

    expect(sixth.ok).toBe(false)
    if (!sixth.ok) {
      expect(sixth.error.code).toBe('RATE_LIMITED')
    }
  })
})
