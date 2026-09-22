import type { Metadata } from 'next'
import { ChevronLeftIcon } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { ActivityTimelineErrorBoundary } from '@/features/activity/components/activity-timeline-error'
import { ActivityTimelineSkeleton } from '@/features/activity/components/activity-timeline-skeleton'
import { RequestActivitySection } from '@/features/activity/components/activity-timeline'
import { RequestDetailPanel } from '@/features/requests/components/request-detail-panel'
import { loadRequestByReference } from '@/features/requests/lib/load-request'
import { getFilterOptions } from '@/server/services/reference.service'

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
  const [request, filterOptions] = await Promise.all([
    loadRequestByReference(id),
    getFilterOptions(),
  ])

  if (!request) {
    notFound()
  }

  const assigneeOptions = filterOptions.assignees.map(({ id: assigneeId, name }) => ({
    id: assigneeId,
    name,
  }))

  return (
    <div className="space-y-6">
      <nav aria-label="Request navigation">
        <Link
          href="/requests"
          className="text-muted-foreground hover:text-foreground -ml-1 inline-flex items-center gap-1 rounded-sm px-1 py-0.5 text-sm font-medium transition-colors"
        >
          <ChevronLeftIcon aria-hidden="true" className="size-4 shrink-0" />
          Back to all requests
        </Link>
      </nav>
      <RequestDetailPanel
        request={request}
        canEditStatus
        canEditAssignee
        assigneeOptions={assigneeOptions}
      />
      <ActivityTimelineErrorBoundary>
        <Suspense fallback={<ActivityTimelineSkeleton />}>
          <RequestActivitySection requestId={request.id} />
        </Suspense>
      </ActivityTimelineErrorBoundary>
    </div>
  )
}
