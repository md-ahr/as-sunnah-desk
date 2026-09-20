import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Insights · As-Sunnah Desk',
}

export default function InsightsPage() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Insights</h1>
      <p className="text-sm text-muted-foreground">Activity summary arrives in Phase 6.</p>
    </div>
  )
}
