import { describe, expect, it } from 'vitest'

import { formatAbsoluteTime, formatRelativeTime, initials } from '@/features/requests/lib/labels'

describe('formatRelativeTime', () => {
  const now = new Date('2026-01-15T12:00:00.000Z')

  it('formats elapsed minutes against the provided clock', () => {
    expect(formatRelativeTime(new Date('2026-01-15T11:30:00.000Z'), now)).toBe('30 minutes ago')
  })

  it('accepts a numeric now value', () => {
    expect(formatRelativeTime(new Date('2026-01-15T11:30:00.000Z'), now.getTime())).toBe(
      '30 minutes ago',
    )
  })

  it('formats elapsed hours against the provided clock', () => {
    expect(formatRelativeTime(new Date('2026-01-15T09:00:00.000Z'), now)).toBe('3 hours ago')
  })

  it('formats elapsed days against the provided clock', () => {
    expect(formatRelativeTime(new Date('2026-01-13T12:00:00.000Z'), now)).toBe('2 days ago')
  })

  it('rolls days up into months', () => {
    expect(formatRelativeTime(new Date('2025-12-16T12:00:00.000Z'), now)).toBe('1 month ago')
    expect(formatRelativeTime(new Date('2025-11-06T12:00:00.000Z'), now)).toBe('2 months ago')
  })

  it('rolls long spans up into years', () => {
    expect(formatRelativeTime(new Date('2024-12-11T12:00:00.000Z'), now)).toBe('1 year ago')
    expect(formatRelativeTime(new Date('2024-01-16T12:00:00.000Z'), now)).toBe('2 years ago')
  })
})

describe('formatAbsoluteTime', () => {
  it('formats an absolute timestamp in the runtime locale and timezone by default', () => {
    const formatted = formatAbsoluteTime(new Date('2026-01-15T10:00:00.000Z'))

    expect(formatted.length).toBeGreaterThan(0)
  })

  it('accepts explicit locale and timezone overrides', () => {
    const formatted = formatAbsoluteTime(new Date('2026-01-15T10:00:00.000Z'), {
      locale: 'en-US',
      timeZone: 'UTC',
      hour12: true,
    })

    expect(formatted).toMatch(/Jan/)
    expect(formatted).toMatch(/2026/)
    expect(formatted).toMatch(/10:00 AM/)
  })
})

describe('initials', () => {
  it('uses the first letters of the first two names', () => {
    expect(initials('Admin User')).toBe('AU')
  })

  it('falls back for a single name', () => {
    expect(initials('Admin')).toBe('AD')
  })

  it('returns a placeholder for blank names', () => {
    expect(initials('   ')).toBe('?')
  })
})
