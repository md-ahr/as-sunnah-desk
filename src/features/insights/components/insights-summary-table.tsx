import {
  formatResolutionRate,
  formatResolutionTime,
} from '@/features/insights/lib/format-resolution'
import type { InsightsDto } from '@/server/services/insights.service'

type InsightsSummaryTableProps = {
  insights: InsightsDto
}

export function InsightsSummaryTable({ insights }: InsightsSummaryTableProps) {
  if (insights.summaries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No assignee activity is available yet. Assigned service requests will appear here.
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border shadow-sm">
      <table className="w-full">
        <caption className="sr-only">
          Assignee performance summary sorted by total resolved requests.
        </caption>
        <thead className="bg-muted/40">
          <tr>
            <th
              scope="col"
              className="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
            >
              Assignee
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-right text-sm font-medium text-muted-foreground tabular-nums"
            >
              Assigned
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-right text-sm font-medium text-muted-foreground tabular-nums"
            >
              Resolved
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-right text-sm font-medium text-muted-foreground tabular-nums"
            >
              Resolution rate
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-right text-sm font-medium text-muted-foreground tabular-nums"
            >
              Avg time
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-right text-sm font-medium text-muted-foreground tabular-nums"
            >
              Median time
            </th>
          </tr>
        </thead>
        <tbody>
          {insights.summaries.map((row) => (
            <tr key={row.assigneeId} className="border-t border-border">
              <th scope="row" className="px-4 py-3 text-left text-sm font-medium">
                {row.assigneeName}
              </th>
              <td className="px-4 py-3 text-right text-sm tabular-nums">
                {row.totalAssigned.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right text-sm tabular-nums">
                {row.totalResolved.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right text-sm tabular-nums">
                {formatResolutionRate(row.resolutionRate)}
              </td>
              <td className="px-4 py-3 text-right text-sm tabular-nums">
                {formatResolutionTime(row.averageResolutionTimeMs)}
              </td>
              <td className="px-4 py-3 text-right text-sm tabular-nums">
                {formatResolutionTime(row.medianResolutionTimeMs)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
