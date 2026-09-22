// @vitest-environment node

import { sealData } from 'iron-session'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SESSION_COOKIE_NAME } from '@/lib/auth/constants'
import { env } from '@/server/env'

const cookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => cookieStore),
}))

import { createSession, deleteSession, getSession } from '@/server/auth/session'

describe('session cookie helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns an empty session when the cookie is missing', async () => {
    cookieStore.get.mockReturnValue(undefined)

    await expect(getSession()).resolves.toEqual({})
  })

  it('unseals a valid session cookie', async () => {
    const sealed = await sealData({ userId: 'user_admin' }, { password: env.SESSION_PASSWORD })
    cookieStore.get.mockReturnValue({ value: sealed })

    await expect(getSession()).resolves.toEqual({ userId: 'user_admin' })
  })

  it('returns an empty session when the cookie cannot be unsealed', async () => {
    cookieStore.get.mockReturnValue({ value: 'not-a-valid-seal' })

    await expect(getSession()).resolves.toEqual({})
  })

  it('creates a secure session cookie', async () => {
    await createSession('user_admin')

    expect(cookieStore.set).toHaveBeenCalledWith(
      SESSION_COOKIE_NAME,
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      }),
    )
  })

  it('deletes the session cookie on logout', async () => {
    await deleteSession()

    expect(cookieStore.delete).toHaveBeenCalledWith(SESSION_COOKIE_NAME)
  })
})
