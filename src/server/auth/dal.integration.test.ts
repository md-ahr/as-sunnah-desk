import { afterEach, describe, expect, it, vi } from 'vitest'

import { requireUser } from '@/server/services/session.service'
import * as session from '@/server/auth/session'
import * as userRepository from '@/server/repositories/user.repository'

describe('DAL requireUser', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns unauthorized when no session exists', async () => {
    vi.spyOn(session, 'getSession').mockResolvedValue({})

    const result = await requireUser()

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('UNAUTHORIZED')
    }
  })

  it('returns unauthorized when the session user is inactive or missing', async () => {
    vi.spyOn(session, 'getSession').mockResolvedValue({ userId: 'user_missing' })
    vi.spyOn(userRepository, 'findActiveUserById').mockResolvedValue(null)

    const result = await requireUser()

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('UNAUTHORIZED')
    }
  })

  it('resolves an active user from the session via user.repository', async () => {
    vi.spyOn(session, 'getSession').mockResolvedValue({ userId: 'user_admin' })
    vi.spyOn(userRepository, 'findActiveUserById').mockResolvedValue({
      id: 'user_admin',
      email: 'admin@assunnah.test',
      name: 'Admin User',
    })

    const result = await requireUser()

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data).toEqual({
        id: 'user_admin',
        email: 'admin@assunnah.test',
        name: 'Admin User',
      })
    }
    expect(userRepository.findActiveUserById).toHaveBeenCalledWith('user_admin')
  })
})
