import type { Metadata } from 'next'
import { Suspense } from 'react'

import { RequestsDashboard } from '@/features/requests/components/requests-dashboard'
import { RequestTableSkeleton } from '@/features/requests/components/request-table-skeleton'

export const metadata: Metadata = {
  title: 'Service requests · As-Sunnah Desk',
}

type RequestsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default function RequestsPage({ searchParams }: RequestsPageProps) {
  return (
    <div className="space-y-6">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">Service requests</h1>
      <Suspense fallback={<RequestTableSkeleton rows={10} />}>
        <RequestsDashboard searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
