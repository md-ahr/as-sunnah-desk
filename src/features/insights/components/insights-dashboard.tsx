import { InsightsOverview } from '@/features/insights/components/insights-overview'
import { InsightsSummaryTable } from '@/features/insights/components/insights-summary-table'
import { RejectedRecordsDisclosure } from '@/features/insights/components/rejected-records-disclosure'
import { getAssigneeInsights } from '@/server/services/insights.service'

export async function InsightsDashboard() {
  const insights = await getAssigneeInsights()
  const hasSummaries = insights.summaries.length > 0

  return (
    <div className="space-y-6">
      {hasSummaries ? <InsightsOverview insights={insights} /> : null}
      <InsightsSummaryTable insights={insights} />
      <RejectedRecordsDisclosure stats={insights.stats} />
    </div>
  )
}
