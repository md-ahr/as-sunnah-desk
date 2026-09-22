import type { LucideIcon } from 'lucide-react'
import {
  CircleCheckIcon,
  ClipboardListIcon,
  DatabaseIcon,
  TrendingUpIcon,
  UsersIcon,
} from 'lucide-react'

import { formatResolutionRate } from '@/features/insights/lib/format-resolution'
import type { InsightsDto } from '@/server/services/insights.service'

type InsightsOverviewProps = {
  insights: InsightsDto
}

function OverviewStat({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: LucideIcon
}) {
  return (
    <div className="bg-card border-border rounded-lg border px-4 py-3">
      <dt className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
        <Icon aria-hidden="true" className="size-3.5 shrink-0" />
        {label}
      </dt>
      <dd className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</dd>
    </div>
  )
}

export function InsightsOverview({ insights }: InsightsOverviewProps) {
  const totalAssigned = insights.summaries.reduce((sum, row) => sum + row.totalAssigned, 0)
  const totalResolved = insights.summaries.reduce((sum, row) => sum + row.totalResolved, 0)
  const overallRate = totalAssigned > 0 ? totalResolved / totalAssigned : 0
  const acceptanceRate =
    insights.stats.processed > 0 ? insights.stats.accepted / insights.stats.processed : 0

  return (
    <section aria-labelledby="insights-overview-heading">
      <h2 id="insights-overview-heading" className="sr-only">
        Summary overview
      </h2>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
        <OverviewStat
          label="Assignees"
          value={insights.summaries.length.toLocaleString()}
          icon={UsersIcon}
        />
        <OverviewStat
          label="Total assigned"
          value={totalAssigned.toLocaleString()}
          icon={ClipboardListIcon}
        />
        <OverviewStat
          label="Total resolved"
          value={totalResolved.toLocaleString()}
          icon={CircleCheckIcon}
        />
        <OverviewStat
          label="Resolution rate"
          value={formatResolutionRate(overallRate)}
          icon={TrendingUpIcon}
        />
        <OverviewStat
          label="Records included"
          value={formatResolutionRate(acceptanceRate)}
          icon={DatabaseIcon}
        />
      </dl>
    </section>
  )
}
