import { describe, expect, it } from 'vitest'

import { tags } from '@/server/cache/tags'

describe('cache tags', () => {
  it('builds request-scoped tags', () => {
    expect(tags.request('req_1')).toBe('request:req_1')
    expect(tags.requestActivity('req_1')).toBe('request-activity:req_1')
  })

  it('builds shared reference tags', () => {
    expect(tags.referenceFilters()).toBe('reference:filters')
    expect(tags.facetCounts()).toBe('facet-counts')
    expect(tags.assigneeSummary()).toBe('assignee-summary')
  })
})
