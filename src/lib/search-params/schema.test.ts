import { describe, expect, it } from 'vitest'

import { DEFAULT_SORT } from '@/lib/search-params/cursor'
import type { SearchParams } from '@/lib/search-params/schema'
import {
  hasActiveFilters,
  parseSearchParams,
  serialiseSearchParams,
  withSearchParams,
} from '@/lib/search-params/schema'

describe('search-params schema', () => {
  it('falls back to defaults for invalid values', () => {
    const parsed = parseSearchParams({
      sort: 'not-a-sort',
      perPage: '999',
      page: '99',
      status: ['new', 'bogus'],
      category: ['it-support', 'unknown-category'],
    })

    expect(parsed.sort).toBe(DEFAULT_SORT)
    expect(parsed.perPage).toBe(10)
    expect(parsed.page).toBe(1)
    expect(parsed.status).toEqual(['new'])
    expect(parsed.category).toEqual(['it-support'])
  })

  it('round-trips serialisation for valid filters', () => {
    const input: SearchParams = {
      q: 'laptop',
      status: ['new', 'in_progress'],
      priority: ['high'],
      category: ['it-support', 'hr'],
      assignee: ['user_admin', 'unassigned'],
      sort: 'created_desc',
      perPage: 25,
      page: 2,
    }

    const serialised = serialiseSearchParams(input)
    const parsed = parseSearchParams(new URLSearchParams(serialised))

    expect(parsed).toEqual({
      ...input,
      cursor: undefined,
    })
  })

  it('clears cursor and page when filters change', () => {
    const current = parseSearchParams({
      cursor: 'abc',
      page: '3',
      status: 'new',
    })

    const next = withSearchParams(current, { status: ['new', 'in_progress'] })

    expect(next.cursor).toBeUndefined()
    expect(next.page).toBe(1)
    expect(next.status).toEqual(['new', 'in_progress'])
  })

  it('detects active filters', () => {
    expect(hasActiveFilters(parseSearchParams({}))).toBe(false)
    expect(hasActiveFilters(parseSearchParams({ q: 'desk' }))).toBe(true)
    expect(hasActiveFilters(parseSearchParams({ status: 'new' }))).toBe(true)
  })

  it('keeps deep page numbers only when a cursor or an end seek is present', () => {
    expect(parseSearchParams({ page: '25' }).page).toBe(1)
    expect(parseSearchParams({ page: '25', cursor: 'abc' }).page).toBe(25)
    expect(parseSearchParams({ page: '1200', seek: 'end' })).toMatchObject({
      page: 1200,
      seek: 'end',
      cursor: undefined,
    })
  })

  it('drops an end seek when filters change', () => {
    const current = parseSearchParams({ seek: 'end', page: '1200', status: 'new' })
    const next = withSearchParams(current, { status: ['in_progress'] })

    expect(next.seek).toBeUndefined()
    expect(next.page).toBe(1)
    expect(next.cursor).toBeUndefined()
  })
})
