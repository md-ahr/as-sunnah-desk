import type { ReactNode } from 'react'

import { EmptyState } from '@/features/requests/components/empty-state'
import { RequestRow } from '@/features/requests/components/request-row'
import { SortLink } from '@/features/requests/components/sort-link'
import { ariaSortForColumn, REQUEST_COLUMNS } from '@/features/requests/request-columns'
import type { SearchParams } from '@/lib/search-params/schema'
import { hasActiveFilters } from '@/lib/search-params/schema'
import type { RequestListItemDto } from '@/features/requests/types'

type RequestTableProps = {
  rows: readonly RequestListItemDto[]
  params: SearchParams
  total: number
  now: number
  footer?: ReactNode
}

export function RequestTable({ rows, params, total, now, footer }: RequestTableProps) {
  if (rows.length === 0) {
    return <EmptyState hasActiveFilters={hasActiveFilters(params)} />
  }

  const totalLabel = `${String(total)} results`

  return (
    <div className="request-table-shell border-border bg-card overflow-hidden rounded-lg border">
      <div className="request-table-scroll max-md:overflow-x-hidden md:overflow-x-auto xl:overflow-x-visible">
        <table className="request-table w-full border-collapse md:min-w-[80rem] md:table-fixed xl:min-w-0">
          <colgroup>
            <col className="w-36" />
            <col />
            <col className="w-44" />
            <col className="w-40" />
            <col className="w-28" />
            <col className="w-36" />
            <col className="w-36" />
            <col className="w-32" />
            <col className="w-24" />
          </colgroup>
          <caption className="sr-only">
            Service requests, sorted by {params.sort.replaceAll('_', ' ')}. {totalLabel}.
          </caption>
          <thead className="request-table-head bg-muted/60 hidden md:table-header-group">
            <tr className="border-border border-b">
              {REQUEST_COLUMNS.map((column) => (
                <th
                  key={column.id}
                  scope="col"
                  aria-sort={ariaSortForColumn(column, params.sort)}
                  className="text-muted-foreground px-4 py-2.5 text-left text-sm font-medium whitespace-nowrap"
                >
                  {column.sortKey ? (
                    <SortLink
                      sortKey={column.sortKey}
                      currentSort={params.sort}
                      params={params}
                      className="whitespace-nowrap"
                    >
                      {column.label}
                    </SortLink>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
              <th scope="col" className="w-24 px-2 py-2.5">
                <span className="sr-only">View details</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <RequestRow key={row.id} row={row} canEditStatus now={now} />
            ))}
          </tbody>
        </table>
      </div>
      {footer ? (
        <div className="border-border flex flex-col items-center gap-4 border-t px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:gap-3 lg:py-3">
          {footer}
        </div>
      ) : null}
    </div>
  )
}
