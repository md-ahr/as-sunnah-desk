export const tags = {
  request: (id: string) => `request:${id}` as const,
  requestActivity: (id: string) => `request-activity:${id}` as const,
  referenceFilters: () => 'reference:filters' as const,
  facetCounts: () => 'facet-counts' as const,
  assigneeSummary: () => 'assignee-summary' as const,
}
