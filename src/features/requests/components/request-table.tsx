import { EmptyState } from '@/features/requests/components/empty-state'
import { RequestRow } from '@/features/requests/components/request-row'
import { SortLink } from '@/features/requests/components/sort-link'
import {
  ariaSortForColumn,
  columnMobileHiddenProps,
  REQUEST_COLUMNS,
} from '@/features/requests/request-columns'
import type { AuthenticatedUser } from '@/server/services/session.service'
import { canUpdateRequestStatus } from '@/server/services/request-permissions.service'
import type { SearchParams } from '@/lib/search-params/schema'
import { hasActiveFilters } from '@/lib/search-params/schema'
import type { RequestListItemDto } from '@/features/requests/types'

type RequestTableProps = {
  rows: readonly RequestListItemDto[]
  params: SearchParams
  total: number | `${number}+`
  user: AuthenticatedUser
  now: number
}

export function RequestTable({ rows, params, total, user, now }: RequestTableProps) {
  if (rows.length === 0) {
    return <EmptyState hasActiveFilters={hasActiveFilters(params)} />
  }

  const totalLabel = typeof total === 'number' ? `${String(total)} results` : `${total} results`

  return (
    <div className="request-table-shell border-border overflow-hidden rounded-lg border">
      <table className="request-table w-full">
        <caption className="sr-only">
          Service requests, sorted by {params.sort.replaceAll('_', ' ')}. {totalLabel}.
        </caption>
        <thead className="request-table-head bg-muted/40 hidden sm:table-header-group">
          <tr>
            {REQUEST_COLUMNS.map((column) => (
              <th
                key={column.id}
                scope="col"
                aria-sort={ariaSortForColumn(column, params.sort)}
                className="text-muted-foreground px-4 py-3 text-left text-sm font-medium"
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
            <RequestRow
              key={row.id}
              row={row}
              canEditStatus={canUpdateRequestStatus(user, row)}
              now={now}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
