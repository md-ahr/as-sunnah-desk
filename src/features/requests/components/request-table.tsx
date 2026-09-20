import { EmptyState } from '@/features/requests/components/empty-state'
import { RequestRow } from '@/features/requests/components/request-row'
import { SortLink } from '@/features/requests/components/sort-link'
import {
  ariaSortForColumn,
  columnMobileHiddenProps,
  REQUEST_COLUMNS,
} from '@/features/requests/request-columns'
import type { SearchParams } from '@/lib/search-params/schema'
import { hasActiveFilters } from '@/lib/search-params/schema'
import type { RequestListItemDto } from '@/features/requests/types'

type RequestTableProps = {
  rows: readonly RequestListItemDto[]
  params: SearchParams
  total: number | `${number}+`
}

export function RequestTable({ rows, params, total }: RequestTableProps) {
  if (rows.length === 0) {
    return <EmptyState hasActiveFilters={hasActiveFilters(params)} />
  }

  const totalLabel = typeof total === 'number' ? `${String(total)} results` : `${total} results`

  return (
    <div className="request-table-shell overflow-hidden rounded-lg border border-border">
      <table className="request-table w-full">
        <caption className="sr-only">
          Service requests, sorted by {params.sort.replaceAll('_', ' ')}. {totalLabel}.
        </caption>
        <thead className="request-table-head hidden bg-muted/40 sm:table-header-group">
          <tr>
            {REQUEST_COLUMNS.map((column) => (
              <th
                key={column.id}
                scope="col"
                aria-sort={ariaSortForColumn(column, params.sort)}
                className="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
                {...columnMobileHiddenProps(column)}
              >
                {column.sortKey ? (
                  <SortLink sortKey={column.sortKey} currentSort={params.sort} params={params}>
                    {column.label}
                  </SortLink>
                ) : (
                  column.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <RequestRow key={row.id} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
