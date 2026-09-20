import { Skeleton } from '@/components/ui/skeleton'
import { columnMobileHiddenProps, REQUEST_COLUMNS } from '@/features/requests/request-columns'

type RequestTableSkeletonProps = {
  rows?: number
}

export function RequestTableSkeleton({ rows = 10 }: RequestTableSkeletonProps) {
  return (
    <div className="request-table-shell overflow-hidden rounded-lg border border-border">
      <table className="request-table w-full">
        <caption className="sr-only">Loading service requests</caption>
        <thead className="request-table-head hidden sm:table-header-group">
          <tr>
            {REQUEST_COLUMNS.map((column) => (
              <th
                key={column.id}
                scope="col"
                className="px-4 py-3 text-left text-sm font-medium"
                {...columnMobileHiddenProps(column)}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, index) => (
            <tr key={index} className="request-table-row border-t border-border">
              {REQUEST_COLUMNS.map((column) => (
                <td
                  key={column.id}
                  className="px-4 py-3"
                  data-label={column.label}
                  {...columnMobileHiddenProps(column)}
                >
                  <Skeleton className="h-4 w-full max-w-[12rem]" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
