import type { Metadata } from 'next'
import { Suspense } from 'react'

import { InsightsDashboard } from '@/features/insights/components/insights-dashboard'
import { InsightsSummarySkeleton } from '@/features/insights/components/insights-summary-skeleton'

export const metadata: Metadata = {
  title: 'Insights · As-Sunnah Desk',
  description: 'Per-assignee performance summary for service request activity.',
}

export default function InsightsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Assignee performance</h1>
        <p className="text-sm text-muted-foreground">
          Totals and resolution times aggregated from assigned service requests.
        </p>
      </div>
      <Suspense fallback={<InsightsSummarySkeleton />}>
        <InsightsDashboard />
      </Suspense>
    </div>
  )
}
