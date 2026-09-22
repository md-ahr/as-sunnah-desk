import { describe, expect, it } from 'vitest'

import { pageWindow } from '@/features/requests/lib/page-window'

describe('pageWindow', () => {
  it('lists every page when the range is short', () => {
    expect(pageWindow(1, 10)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })

  it('keeps the first and last five pages with a gap between them', () => {
    expect(pageWindow(1, 20)).toEqual([1, 2, 3, 4, 5, 'ellipsis', 16, 17, 18, 19, 20])
    expect(pageWindow(5, 20)).toEqual([1, 2, 3, 4, 5, 6, 7, 'ellipsis', 16, 17, 18, 19, 20])
    expect(pageWindow(20, 20)).toEqual([1, 2, 3, 4, 5, 'ellipsis', 16, 17, 18, 19, 20])
  })

  it('keeps the current page visible in the middle of a long range', () => {
    expect(pageWindow(10, 20)).toEqual([1, 2, 'ellipsis', 9, 10, 11, 'ellipsis', 19, 20])
  })

  it('includes the current page for every position in a 20-page range', () => {
    for (let page = 1; page <= 20; page += 1) {
      const tokens = pageWindow(page, 20).filter((token) => token !== 'ellipsis')
      expect(tokens).toContain(page)
    }
  })

  it('returns no tokens when the total page count is invalid', () => {
    expect(pageWindow(1, 0)).toEqual([])
  })

  it('merges overlapping head and tail groups without duplicate pages', () => {
    expect(pageWindow(1, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('clamps the current page to the available range', () => {
    expect(pageWindow(99, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })
})
