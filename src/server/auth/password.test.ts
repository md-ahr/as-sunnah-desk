import { describe, expect, it } from 'vitest'

import { hashPassword, verifyPassword, verifyPasswordOrDummy } from '@/server/auth/password'

describe('password helpers', () => {
  it('hashes and verifies a password', async () => {
    const hash = await hashPassword('test.agent')
    expect(await verifyPassword('test.agent', hash)).toBe(true)
    expect(await verifyPassword('wrong-password', hash)).toBe(false)
  })

  it('verifies against a dummy hash when no user hash is provided', async () => {
    expect(await verifyPasswordOrDummy('timing-safe-dummy-password-not-for-login', null)).toBe(
      true,
    )
    expect(await verifyPasswordOrDummy('not-the-dummy-password', null)).toBe(false)
  })
})
