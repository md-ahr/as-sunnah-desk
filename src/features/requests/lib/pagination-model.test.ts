import { describe, expect, it } from 'vitest'

import {
  OFFSET_PAGE_LIMIT,
  pageItemRange,
  pageTarget,
  paginationTokens,
  totalPages,
} from '@/features/requests/lib/pagination-model'

describe('pagination model', () => {
  it('computes total pages from result count and page size', () => {
    expect(totalPages(12_000, 10)).toBe(1_200)
    expect(totalPages(0, 10)).toBe(1)
  })

  it('computes the visible item range for the current page', () => {
    expect(pageItemRange(1, 10, 12_000)).toEqual({ start: 1, end: 10 })
    expect(pageItemRange(5, 10, 12_000)).toEqual({ start: 41, end: 50 })
    expect(pageItemRange(1_200, 10, 12_000)).toEqual({ start: 11_991, end: 12_000 })
    expect(pageItemRange(1, 10, 0)).toEqual({ start: 0, end: 0 })
  })

  it('keeps the first twenty pages linkable and shows the full page count', () => {
    expect(paginationTokens(5, 1_200)).toEqual([
      { type: 'page', page: 1, linked: true },
      { type: 'page', page: 2, linked: true },
      { type: 'page', page: 3, linked: true },
      { type: 'page', page: 4, linked: true },
      { type: 'page', page: 5, linked: true },
      { type: 'page', page: 6, linked: true },
      { type: 'page', page: 7, linked: true },
      { type: 'ellipsis' },
      { type: 'page', page: 16, linked: true },
      { type: 'page', page: 17, linked: true },
      { type: 'page', page: 18, linked: true },
      { type: 'page', page: 19, linked: true },
      { type: 'page', page: 20, linked: true },
      { type: 'ellipsis' },
      { type: 'page', page: 1_200, linked: true },
    ])
  })

  it('focuses the tail of the linkable range when near page twenty of a long list', () => {
    expect(paginationTokens(20, 1_200)).toEqual([
      { type: 'page', page: 1, linked: true },
      { type: 'ellipsis' },
      { type: 'page', page: 18, linked: true },
      { type: 'page', page: 19, linked: true },
      { type: 'page', page: 20, linked: true },
      { type: 'page', page: 21, linked: true },
      { type: 'ellipsis' },
      { type: 'page', page: 1_200, linked: true },
    ])
  })

  it('links the neighbours and the last page around a deep cursor page', () => {
    expect(paginationTokens(21, 1_200)).toEqual([
      { type: 'page', page: 1, linked: true },
      { type: 'ellipsis' },
      { type: 'page', page: 20, linked: true },
      { type: 'page', page: 21, linked: false },
      { type: 'page', page: 22, linked: true },
      { type: 'ellipsis' },
      { type: 'page', page: 1_200, linked: true },
    ])
  })

  it('uses a standard window once the cursor range is left behind', () => {
    expect(paginationTokens(50, 1_200)).toEqual([
      { type: 'page', page: 1, linked: true },
      { type: 'ellipsis' },
      { type: 'page', page: 49, linked: true },
      { type: 'page', page: 50, linked: false },
      { type: 'page', page: 51, linked: true },
      { type: 'ellipsis' },
      { type: 'page', page: 1_200, linked: true },
    ])
  })

  it('chooses a cheap seek for each visible page', () => {
    expect(pageTarget(19, 20, 1_200)).toBe('offset')
    expect(pageTarget(21, 20, 1_200)).toBe('next')
    expect(pageTarget(1_200, 20, 1_200)).toBe('end')
    expect(pageTarget(20, 20, 1_200)).toBe('current')
    expect(pageTarget(49, 50, 1_200)).toBe('prev')
    expect(pageTarget(15, 10, 15)).toBe('offset')
    expect(pageTarget(47, 20, 1_200)).toBe('unreachable')
  })

  it('includes the current page for every position in a long range', () => {
    for (let page = 1; page <= 40; page += 1) {
      const tokens = paginationTokens(page, 1_200, OFFSET_PAGE_LIMIT)
      expect(tokens.some((token) => token.type === 'page' && token.page === page)).toBe(true)
    }
  })
})
