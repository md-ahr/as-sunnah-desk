import { Suspense } from 'react'

import {
  DashboardNavigationProvider,
  RefiningResultsShell,
} from '@/features/requests/components/dashboard-navigation'
import { FilterBar } from '@/features/requests/components/filter-bar'
import { Pagination } from '@/features/requests/components/pagination'
import { PerPageSelect } from '@/features/requests/components/per-page-select'
import { RequestTable } from '@/features/requests/components/request-table'
import { ResultsLiveRegion } from '@/features/requests/components/results-live-region'
import { SearchInput } from '@/features/requests/components/search-input'
import { getFilterOptions } from '@/server/services/reference.service'
import { parseSearchParams } from '@/lib/search-params/schema'
import { getCurrentUser } from '@/server/services/session.service'
import { listRequests } from '@/server/services/request.service'

type RequestsDashboardProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function RequestsDashboard({ searchParams }: RequestsDashboardProps) {
  const [resolvedParams, user, filterOptions] = await Promise.all([
    searchParams,
    getCurrentUser(),
    getFilterOptions(),
  ])

  const params = parseSearchParams(resolvedParams)
  const result = await listRequests(params, user, filterOptions.categories)

  if (!result.ok) {
    throw new Error('Failed to load requests')
  }

  const { page, total, facets } = result.data

  return (
    <DashboardNavigationProvider>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm text-muted-foreground">
            {typeof total === 'number' ? `${String(total)} requests` : `${total} requests`}
          </p>
          <PerPageSelect params={params} />
        </div>

        <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
          <Suspense fallback={<div className="h-9 w-full max-w-md animate-pulse rounded-md bg-muted" />}>
            <SearchInput key={params.q ?? ''} params={params} />
          </Suspense>
          <Suspense fallback={<div className="h-9 w-24 animate-pulse rounded-md bg-muted" />}>
            <FilterBar
              params={params}
              categories={filterOptions.categories}
              assignees={filterOptions.assignees}
              facets={facets}
            />
          </Suspense>
        </div>

        <RefiningResultsShell>
          <RequestTable rows={page.items} params={params} total={total} />

          <Pagination
            params={params}
            hasNextPage={page.hasNextPage}
            nextCursor={page.nextCursor}
            total={total}
          />

          <ResultsLiveRegion total={total} />
        </RefiningResultsShell>
      </div>
    </DashboardNavigationProvider>
  )
}
