import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Service requests · As-Sunnah Desk',
}

export default function RequestsPage() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Service requests</h1>
      <p className="text-sm text-muted-foreground">
        Dashboard arrives in Phase 3. You are signed in and this route is protected.
      </p>
    </div>
  )
}
