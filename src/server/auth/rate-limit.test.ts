import { afterEach, describe, expect, it } from 'vitest'

import {
  checkLoginAttempt,
  recordLoginFailure,
  resetLoginRateLimits,
} from '@/server/auth/rate-limit'

describe('login rate limiter', () => {
  afterEach(() => {
    resetLoginRateLimits()
  })

  it('allows the first five failures within the window', () => {
    const key = 'test-key'

    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect(checkLoginAttempt(key).allowed).toBe(true)
      recordLoginFailure(key)
    }

    const sixth = checkLoginAttempt(key)
    expect(sixth.allowed).toBe(false)
    expect(sixth.retryAfterMs).toBeGreaterThan(0)
  })

  it('tracks independent keys separately', () => {
    recordLoginFailure('user-a')
    recordLoginFailure('user-a')
    recordLoginFailure('user-a')
    recordLoginFailure('user-a')
    recordLoginFailure('user-a')

    expect(checkLoginAttempt('user-a').allowed).toBe(false)
    expect(checkLoginAttempt('user-b').allowed).toBe(true)
  })
})
