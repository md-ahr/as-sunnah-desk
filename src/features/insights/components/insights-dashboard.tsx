import { InsightsSummaryTable } from '@/features/insights/components/insights-summary-table'
import { RejectedRecordsDisclosure } from '@/features/insights/components/rejected-records-disclosure'
import { getAssigneeInsights } from '@/server/services/insights.service'

export async function InsightsDashboard() {
  const insights = await getAssigneeInsights()

  return (
    <div className="space-y-6">
      <InsightsSummaryTable insights={insights} />
      <RejectedRecordsDisclosure stats={insights.stats} />
    </div>
  )
}
