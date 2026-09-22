import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  formatResolutionRate,
  formatResolutionTime,
} from '@/features/insights/lib/format-resolution'
import { initials } from '@/features/requests/lib/labels'
import type { InsightsDto, InsightsSummaryRow } from '@/server/services/insights.service'

type InsightsSummaryTableProps = {
  insights: InsightsDto
}

function InsightsSummaryRowView({ row }: { row: InsightsSummaryRow }) {
  return (
    <tr className="insights-table-row border-border hover:bg-muted/50 border-b align-middle last:border-b-0">
      <th scope="row" className="min-w-0 px-4 py-3 text-left align-middle" data-label="Assignee">
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar className="size-8 shrink-0">
            <AvatarFallback className="text-xs">{initials(row.assigneeName)}</AvatarFallback>
          </Avatar>
          <span className="truncate text-sm font-medium">{row.assigneeName}</span>
        </div>
      </th>
      <td className="px-4 py-3 text-left align-middle text-sm tabular-nums" data-label="Assigned">
        {row.totalAssigned.toLocaleString()}
      </td>
      <td className="px-4 py-3 text-left align-middle text-sm tabular-nums" data-label="Resolved">
        {row.totalResolved.toLocaleString()}
      </td>
      <td
        className="px-4 py-3 text-left align-middle text-sm tabular-nums"
        data-label="Resolution rate"
      >
        {formatResolutionRate(row.resolutionRate)}
      </td>
      <td
        className="px-4 py-3 text-left align-middle text-sm whitespace-nowrap tabular-nums"
        data-label="Avg time"
      >
        {formatResolutionTime(row.averageResolutionTimeMs)}
      </td>
      <td
        className="px-4 py-3 text-left align-middle text-sm whitespace-nowrap tabular-nums"
        data-label="Median time"
      >
        {formatResolutionTime(row.medianResolutionTimeMs)}
      </td>
    </tr>
  )
}

export function InsightsSummaryTable({ insights }: InsightsSummaryTableProps) {
  if (insights.summaries.length === 0) {
    return (
      <div
        role="status"
        className="border-border rounded-lg border border-dashed px-6 py-16 text-center"
      >
        <h2 className="text-lg font-medium">No assignee activity yet</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Assigned service requests will appear here once activity is recorded.
        </p>
      </div>
    )
  }

  const assigneeCount = insights.summaries.length.toLocaleString()

  return (
    <section
      className="insights-table-shell border-border bg-card overflow-hidden rounded-lg border"
      aria-labelledby="insights-summary-heading"
    >
      <div className="border-border border-b px-4 py-4 sm:px-6">
        <h2 id="insights-summary-heading" className="text-base font-semibold tracking-tight">
          Per-assignee breakdown
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Sorted by resolved count. {assigneeCount} assignees with recorded activity.
        </p>
      </div>

      <div className="insights-table-scroll max-md:overflow-x-hidden md:overflow-x-auto xl:overflow-x-visible">
        <table className="insights-table w-full border-collapse md:min-w-[44rem] md:table-auto">
          <colgroup>
            <col className="w-52" />
            <col className="w-24" />
            <col className="w-24" />
            <col className="w-32" />
            <col className="w-28" />
            <col className="w-28" />
          </colgroup>
          <caption className="sr-only">
            Assignee performance summary sorted by total resolved requests.
          </caption>
          <thead className="insights-table-head bg-muted/60 hidden md:table-header-group">
            <tr className="border-border border-b">
              <th
                scope="col"
                className="text-muted-foreground px-4 py-2.5 text-left text-sm font-medium whitespace-nowrap"
              >
                Assignee
              </th>
              <th
                scope="col"
                className="text-muted-foreground px-4 py-2.5 text-left text-sm font-medium whitespace-nowrap tabular-nums"
              >
                Assigned
              </th>
              <th
                scope="col"
                className="text-muted-foreground px-4 py-2.5 text-left text-sm font-medium whitespace-nowrap tabular-nums"
              >
                Resolved
              </th>
              <th
                scope="col"
                className="text-muted-foreground px-4 py-2.5 text-left text-sm font-medium whitespace-nowrap tabular-nums"
              >
                Resolution rate
              </th>
              <th
                scope="col"
                className="text-muted-foreground px-4 py-2.5 text-left text-sm font-medium whitespace-nowrap tabular-nums"
              >
                Avg time
              </th>
              <th
                scope="col"
                className="text-muted-foreground px-4 py-2.5 text-left text-sm font-medium whitespace-nowrap tabular-nums"
              >
                Median time
              </th>
            </tr>
          </thead>
          <tbody>
            {insights.summaries.map((row) => (
              <InsightsSummaryRowView key={row.assigneeId} row={row} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
