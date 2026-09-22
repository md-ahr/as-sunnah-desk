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
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">Assignee performance</h1>
        <p className="text-muted-foreground max-w-2xl text-sm text-pretty">
          Totals and resolution times aggregated from assigned service requests.
        </p>
      </header>
      <Suspense fallback={<InsightsSummarySkeleton />}>
        <InsightsDashboard />
      </Suspense>
    </div>
  )
}
