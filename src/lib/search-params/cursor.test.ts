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
    const cursor = { id: 'req_123', sortValue: 1_735_000_000_000, direction: 'next' as const }

    expect(decodeCursor(encodeCursor(cursor))).toEqual(cursor)
  })

  it('returns null for malformed tokens', () => {
    expect(decodeCursor('not-a-cursor')).toBeNull()
  })

  it('defaults missing direction to next', () => {
    const token = Buffer.from(JSON.stringify({ id: 'req_1', sortValue: 42 }), 'utf8').toString(
      'base64url',
    )

    expect(decodeCursor(token)).toEqual({
      id: 'req_1',
      sortValue: 42,
      direction: 'next',
    })
  })

  it('rejects cursors with invalid direction values', () => {
    const token = Buffer.from(
      JSON.stringify({ id: 'req_1', sortValue: 42, direction: 'sideways' }),
      'utf8',
    ).toString('base64url')

    expect(decodeCursor(token)).toBeNull()
  })

  it('rejects cursors with invalid payloads', () => {
    const token = Buffer.from(
      JSON.stringify({ sortValue: 42, direction: 'next' }),
      'utf8',
    ).toString('base64url')

    expect(decodeCursor(token)).toBeNull()
  })

  it('builds sort values from row data', () => {
    const row = {
      id: 'req_1',
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      priorityRank: 3,
    }

    expect(cursorFromRow('updated_desc', row).sortValue).toBe(row.updatedAt.getTime())
    expect(cursorFromRow('updated_asc', row, 'prev').sortValue).toBe(row.updatedAt.getTime())
    expect(cursorFromRow('created_desc', row).sortValue).toBe(row.createdAt.getTime())
    expect(cursorFromRow('priority_desc', row).sortValue).toBe(3)
    expect(cursorFromRow('priority_asc', row).sortValue).toBe(3)
    expect(isSortKey('priority_asc')).toBe(true)
  })
})
