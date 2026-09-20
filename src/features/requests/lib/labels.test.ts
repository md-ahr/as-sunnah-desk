import { describe, expect, it } from 'vitest'

import { formatAbsoluteTime, formatRelativeTime, initials } from '@/features/requests/lib/labels'

describe('formatRelativeTime', () => {
  const now = new Date('2026-01-15T12:00:00.000Z')

  it('formats elapsed minutes against the provided clock', () => {
    expect(formatRelativeTime(new Date('2026-01-15T11:30:00.000Z'), now)).toBe('30 minutes ago')
  })

  it('formats elapsed hours against the provided clock', () => {
    expect(formatRelativeTime(new Date('2026-01-15T09:00:00.000Z'), now)).toBe('3 hours ago')
  })

  it('formats elapsed days against the provided clock', () => {
    expect(formatRelativeTime(new Date('2026-01-13T12:00:00.000Z'), now)).toBe('2 days ago')
  })
})

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
