import { describe, expect, it } from 'vitest'

import { paginationHref } from '@/features/requests/lib/pagination-href'
import { parseSearchParams } from '@/lib/search-params/schema'

describe('paginationHref', () => {
  const params = parseSearchParams({ page: '20' })

  it('links the page after the offset window with the next cursor', () => {
    const href = paginationHref(params, 21, 20, 1_200, {
      next: 'cursor-next',
      previous: null,
    })

    expect(href).toContain('cursor=cursor-next')
    expect(href).toContain('page=21')
    expect(href).not.toContain('seek=')
  })

  it('links the last page with an end seek instead of a deep offset', () => {
    const href = paginationHref(params, 1_200, 20, 1_200, {
      next: 'cursor-next',
      previous: null,
    })

    expect(href).toContain('seek=end')
    expect(href).toContain('page=1200')
    expect(href).not.toContain('cursor=')
  })

  it('keeps earlier pages on offset urls', () => {
    const href = paginationHref(params, 19, 20, 1_200, {
      next: 'cursor-next',
      previous: null,
    })

    expect(href).toContain('page=19')
    expect(href).not.toContain('cursor=')
    expect(href).not.toContain('seek=')
  })

  it('returns null for the current page and unreachable pages', () => {
    expect(
      paginationHref(params, 20, 20, 1_200, { next: 'cursor-next', previous: 'cursor-prev' }),
    ).toBeNull()
    expect(
      paginationHref(params, 0, 20, 1_200, { next: 'cursor-next', previous: 'cursor-prev' }),
    ).toBeNull()
  })

  it('links the previous page with the previous cursor', () => {
    const deepParams = parseSearchParams({ page: '22' })
    const href = paginationHref(deepParams, 21, 22, 1_200, {
      next: 'cursor-next',
      previous: 'cursor-prev',
    })

    expect(href).toContain('cursor=cursor-prev')
    expect(href).toContain('page=21')
  })

  it('returns null when a cursor seek is unavailable', () => {
    const deepParams = parseSearchParams({ page: '22' })
    expect(
      paginationHref(deepParams, 23, 22, 1_200, { next: null, previous: 'cursor-prev' }),
    ).toBeNull()
    expect(
      paginationHref(deepParams, 21, 22, 1_200, { next: 'cursor-next', previous: null }),
    ).toBeNull()
  })
})
