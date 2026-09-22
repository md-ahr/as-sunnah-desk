import { describe, expect, it } from 'vitest'

import type { SortKey } from '@/lib/search-params/cursor'
import { buildKeysetPredicate, buildSortOrder } from '@/server/repositories/request-keyset'

const sortKeys: SortKey[] = [
  'updated_desc',
  'updated_asc',
  'created_desc',
  'priority_desc',
  'priority_asc',
]

describe('request keyset helpers', () => {
  it.each(sortKeys)('builds predicates and sort orders for %s', (sort) => {
    const cursor = { id: 'req_1', sortValue: 1_700_000_000_000, direction: 'next' as const }

    expect(buildKeysetPredicate(sort, cursor)).toBeDefined()
    expect(buildKeysetPredicate(sort, { ...cursor, direction: 'prev' })).toBeDefined()
    expect(buildSortOrder(sort)).toHaveLength(2)
    expect(buildSortOrder(sort, 'prev')).toHaveLength(2)
  })
})
