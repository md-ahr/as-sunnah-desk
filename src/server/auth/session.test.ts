// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { sealData, unsealData } from 'iron-session'

import { env } from '@/server/env'

describe('session seal round-trip', () => {
  it('seals and unseals session data with the configured password', async () => {
    const sealed = await sealData({ userId: 'user_admin' }, { password: env.SESSION_PASSWORD })
    const data = await unsealData<{ userId?: string }>(sealed, {
      password: env.SESSION_PASSWORD,
    })

    expect(data.userId).toBe('user_admin')
  })

  it('does not expose a user id from invalid seals', async () => {
    const data = await unsealData<{ userId?: string }>('not-a-valid-seal', {
      password: env.SESSION_PASSWORD,
    })

    expect(data.userId).toBeUndefined()
  })
})
