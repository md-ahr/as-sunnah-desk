import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { ActivityTimelineErrorBoundary } from '@/features/activity/components/activity-timeline-error'
import { ActivityTimelineSkeleton } from '@/features/activity/components/activity-timeline-skeleton'
import { RequestActivitySection } from '@/features/activity/components/activity-timeline'
import { RequestDetailPanel } from '@/features/requests/components/request-detail-panel'
import { loadRequestByReference } from '@/features/requests/lib/load-request'

export async function generateRequestDetailMetadata(
  params: Promise<{ id: string }>,
): Promise<Metadata> {
  const { id } = await params
  const request = await loadRequestByReference(id)

  if (!request) {
    return {
      title: 'Request not found',
      robots: { index: false, follow: false },
    }
  }

  return {
    title: `${request.reference} · ${request.subject}`,
    robots: { index: false, follow: false },
  }
}

export async function RequestDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const request = await loadRequestByReference(id)

  if (!request) {
    notFound()
  }

  return (
    <div className="space-y-8">
      <p>
        <Link
          href="/requests"
          className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
        >
          Back to all requests
        </Link>
      </p>
      <RequestDetailPanel request={request} />
      <ActivityTimelineErrorBoundary>
        <Suspense fallback={<ActivityTimelineSkeleton />}>
          <RequestActivitySection requestId={request.id} />
        </Suspense>
      </ActivityTimelineErrorBoundary>
    </div>
  )
}
