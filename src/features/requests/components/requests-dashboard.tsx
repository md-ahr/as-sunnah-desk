import { Suspense } from 'react'

import {
  DashboardNavigationProvider,
  RefiningResultsShell,
} from '@/features/requests/components/dashboard-navigation'
import { FilterBar } from '@/features/requests/components/filter-bar'
import { Pagination } from '@/features/requests/components/pagination'
import { PerPageSelect } from '@/features/requests/components/per-page-select'
import { ResultRange } from '@/features/requests/components/result-range'
import { RequestTable } from '@/features/requests/components/request-table'
import { ResultsLiveRegion } from '@/features/requests/components/results-live-region'
import { SearchInput } from '@/features/requests/components/search-input'
import { totalPages } from '@/features/requests/lib/pagination-model'
import { getRequestNow } from '@/features/requests/lib/request-now'
import { getFilterOptions } from '@/server/services/reference.service'
import { hasActiveFilters, parseSearchParams } from '@/lib/search-params/schema'
import { getCurrentUser } from '@/server/services/session.service'
import { listRequests } from '@/server/services/request.service'

type RequestsDashboardProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function RequestsDashboard({ searchParams }: RequestsDashboardProps) {
  const [, resolvedParams, filterOptions] = await Promise.all([
    getCurrentUser(),
    searchParams,
    getFilterOptions(),
  ])

  const params = parseSearchParams(resolvedParams)
  const result = await listRequests(params, filterOptions.categories)

  if (!result.ok) {
    throw new Error('Failed to load requests')
  }

  const { page, total, facets } = result.data
  const pageCount = totalPages(total, params.perPage)
  const viewParams =
    params.seek === 'end'
      ? { ...params, page: pageCount }
      : { ...params, page: Math.min(params.page, pageCount) }
  const now = await getRequestNow()
  const count = total.toLocaleString()
  const requestLabel = total === 1 ? 'request' : 'requests'
  const summary = hasActiveFilters(params)
    ? `${count} matching service ${requestLabel}`
    : `Total ${count} service ${requestLabel}`

  return (
    <DashboardNavigationProvider>
      <div className="space-y-6">
        <p className="text-muted-foreground text-sm tabular-nums">{summary}</p>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Suspense
              fallback={<div className="bg-muted h-8 w-full max-w-md animate-pulse rounded-md" />}
            >
              <SearchInput key={params.q ?? ''} params={viewParams} />
            </Suspense>
            <Suspense fallback={<div className="bg-muted h-8 w-80 animate-pulse rounded-md" />}>
              <FilterBar
                params={params}
                categories={filterOptions.categories}
                assignees={filterOptions.assignees}
                facets={facets}
              />
            </Suspense>
          </div>
        </div>

        <RefiningResultsShell>
          <RequestTable
            rows={page.items}
            params={viewParams}
            total={total}
            now={now}
            footer={
              <>
                <div className="flex w-full flex-col items-center gap-2 lg:w-auto lg:flex-row lg:items-center lg:gap-4">
                  <PerPageSelect params={viewParams} />
                  <ResultRange params={viewParams} total={total} />
                </div>
                <Pagination
                  params={viewParams}
                  hasNextPage={page.hasNextPage}
                  hasPreviousPage={page.hasPreviousPage}
                  nextCursor={page.nextCursor}
                  previousCursor={page.previousCursor}
                  total={total}
                />
              </>
            }
          />

          <ResultsLiveRegion total={total} />
        </RefiningResultsShell>
      </div>
    </DashboardNavigationProvider>
  )
}
