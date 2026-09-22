import { describe, expect, it } from 'vitest'

import { messageFor } from '@/features/auth/lib/messages'
import type { LoginError } from '@/features/auth/types'

describe('login error messages', () => {
  it.each([
    [{ code: 'VALIDATION', message: 'Bad input' }, 'Please fix the errors below.'],
    [
      { code: 'RATE_LIMITED', message: 'Slow down' },
      'Too many sign-in attempts. Please wait and try again.',
    ],
    [{ code: 'UNAUTHORIZED', message: 'Nope' }, 'Invalid email or password.'],
    [{ code: 'INTERNAL', message: 'Database unavailable' }, 'Database unavailable'],
  ] satisfies [LoginError, string][])('maps %s to a friendly message', (error, expected) => {
    expect(messageFor(error)).toBe(expected)
  })
})
