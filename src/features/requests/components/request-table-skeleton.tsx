import { Skeleton } from '@/components/ui/skeleton'
import { REQUEST_COLUMNS } from '@/features/requests/request-columns'

type RequestTableSkeletonProps = {
  rows?: number
}

export function RequestTableSkeleton({ rows = 10 }: RequestTableSkeletonProps) {
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
          <caption className="sr-only">Loading service requests</caption>
          <thead className="request-table-head hidden md:table-header-group">
            <tr className="border-border border-b">
              {REQUEST_COLUMNS.map((column) => (
                <th
                  key={column.id}
                  scope="col"
                  className="px-4 py-2.5 text-left text-sm font-medium whitespace-nowrap"
                >
                  {column.label}
                </th>
              ))}
              <th scope="col" className="w-24 px-2 py-2.5">
                <span className="sr-only">View details</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, index) => (
              <tr key={index} className="request-table-row border-border border-b last:border-b-0">
                {REQUEST_COLUMNS.map((column) => (
                  <td key={column.id} className="px-4 py-3" data-label={column.label}>
                    <Skeleton className="h-4 w-full max-w-[12rem]" />
                  </td>
                ))}
                <td className="px-2 py-3 text-right" data-label="View">
                  <Skeleton className="ml-auto h-8 w-20" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-border flex flex-col items-center gap-4 border-t px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:gap-3 lg:py-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-8 w-64" />
      </div>
    </div>
  )
}
