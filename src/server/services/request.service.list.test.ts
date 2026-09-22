// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { parseSearchParams } from '@/lib/search-params/schema'

const {
  mockCacheLife,
  mockCacheTag,
  mockCountMatching,
  mockGetFacetCounts,
  mockListFromEnd,
  mockListOffset,
  mockListPaged,
} = vi.hoisted(() => ({
  mockCacheLife: vi.fn(),
  mockCacheTag: vi.fn(),
  mockCountMatching: vi.fn(),
  mockGetFacetCounts: vi.fn(),
  mockListFromEnd: vi.fn(),
  mockListOffset: vi.fn(),
  mockListPaged: vi.fn(),
}))

vi.mock('next/cache', () => ({
  cacheLife: mockCacheLife,
  cacheTag: mockCacheTag,
}))

vi.mock('@/server/repositories/request.repository', () => ({
  countMatching: mockCountMatching,
  getFacetCounts: mockGetFacetCounts,
  listFromEnd: mockListFromEnd,
  listOffset: mockListOffset,
  listPaged: mockListPaged,
}))

vi.mock('@/server/db/client', () => ({
  getDb: vi.fn(() => ({})),
}))

import { listRequests } from '@/server/services/request.service'

const categories = [
  { id: 'cat_it_support', name: 'IT Support', slug: 'it-support', sortOrder: 1 },
  { id: 'cat_general', name: 'General Enquiries', slug: 'general', sortOrder: 2 },
]

const emptyPage = {
  items: [],
  nextCursor: null,
  previousCursor: null,
  hasNextPage: false,
  hasPreviousPage: false,
}

const facets = {
  status: {},
  priority: {},
  category: {},
  assignee: {},
  total: 0,
}

describe('listRequests', () => {
  beforeEach(() => {
    mockCacheLife.mockReset()
    mockCacheTag.mockReset()
    mockCountMatching.mockReset()
    mockGetFacetCounts.mockReset()
    mockListFromEnd.mockReset()
    mockListOffset.mockReset()
    mockListPaged.mockReset()

    mockGetFacetCounts.mockResolvedValue(facets)
    mockCountMatching.mockResolvedValue(0)
    mockListPaged.mockResolvedValue(emptyPage)
    mockListOffset.mockResolvedValue(emptyPage)
    mockListFromEnd.mockResolvedValue(emptyPage)
  })

  it('loads the first page through keyset pagination', async () => {
    mockCountMatching.mockResolvedValue(12)

    const result = await listRequests(parseSearchParams({}), categories)

    expect(result.ok).toBe(true)
    expect(mockListPaged).toHaveBeenCalledWith(expect.anything(), expect.anything(), null, 10)
    expect(mockListOffset).not.toHaveBeenCalled()
    if (result.ok) {
      expect(result.data.total).toBe(12)
      expect(result.data.facets).toEqual(facets)
    }
  })

  it('uses offset pagination inside the configured window', async () => {
    await listRequests(parseSearchParams({ page: '2', perPage: '25' }), categories)

    expect(mockListOffset).toHaveBeenCalledWith(expect.anything(), expect.anything(), 25, 25)
  })

  it('uses the cursor when one is present', async () => {
    await listRequests(parseSearchParams({ cursor: 'cursor-token', page: '21' }), categories)

    expect(mockListPaged).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      'cursor-token',
      10,
    )
  })

  it('resolves category slugs before querying', async () => {
    await listRequests(parseSearchParams({ category: 'it-support' }), categories)

    expect(mockListPaged).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ categoryIds: ['cat_it_support'] }),
      null,
      10,
    )
  })

  it('loads the last page when seek=end is requested', async () => {
    mockCountMatching.mockResolvedValue(25)
    mockListFromEnd.mockResolvedValue({
      ...emptyPage,
      items: [{ id: 'req_last' }],
      hasPreviousPage: true,
    })

    const result = await listRequests(parseSearchParams({ seek: 'end', perPage: '10' }), categories)

    expect(result.ok).toBe(true)
    expect(mockListFromEnd).toHaveBeenCalledWith(expect.anything(), expect.anything(), 10, 25)
    if (result.ok) {
      expect(result.data.page.items).toHaveLength(1)
    }
  })

  it('returns an empty page when seek=end matches no rows', async () => {
    const result = await listRequests(parseSearchParams({ seek: 'end' }), categories)

    expect(result.ok).toBe(true)
    expect(mockListFromEnd).not.toHaveBeenCalled()
    if (result.ok) {
      expect(result.data.page.items).toEqual([])
      expect(result.data.total).toBe(0)
    }
  })
})
