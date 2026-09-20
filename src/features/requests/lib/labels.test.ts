import { describe, expect, it } from 'vitest'

import { formatAbsoluteTime, initials } from '@/features/requests/lib/labels'

describe('formatAbsoluteTime', () => {
  it('formats an absolute timestamp for display', () => {
    const formatted = formatAbsoluteTime(new Date('2026-01-15T10:00:00.000Z'))

    expect(formatted).toMatch(/15/)
    expect(formatted).toMatch(/2026/)
  })
})

describe('initials', () => {
  it('uses the first letters of the first two names', () => {
    expect(initials('Admin User')).toBe('AU')
  })

  it('falls back for a single name', () => {
    expect(initials('Admin')).toBe('AD')
  })
})
