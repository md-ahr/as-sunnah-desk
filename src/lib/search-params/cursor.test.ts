import { describe, expect, it } from 'vitest'

import {
  cursorFromRow,
  decodeCursor,
  encodeCursor,
  isSortKey,
  SORT_KEYS,
} from '@/lib/search-params/cursor'

describe('search-params cursor', () => {
  it('validates known sort keys', () => {
    expect(SORT_KEYS).toContain('updated_desc')
    expect(isSortKey('updated_desc')).toBe(true)
    expect(isSortKey('invalid')).toBe(false)
  })

  it('round-trips a cursor token', () => {
    const cursor = { id: 'req_123', sortValue: 1_735_000_000_000 }

    expect(decodeCursor(encodeCursor(cursor))).toEqual(cursor)
  })

  it('returns null for malformed tokens', () => {
    expect(decodeCursor('not-a-cursor')).toBeNull()
  })

  it('builds sort values from row data', () => {
    const row = {
      id: 'req_1',
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      priorityRank: 3,
    }

    expect(cursorFromRow('updated_desc', row).sortValue).toBe(row.updatedAt.getTime())
    expect(cursorFromRow('created_desc', row).sortValue).toBe(row.createdAt.getTime())
    expect(cursorFromRow('priority_desc', row).sortValue).toBe(3)
  })
})
