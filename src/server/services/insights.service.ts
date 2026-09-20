import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'

import { summarizeActivityStream } from '@/lib/summarize-activity'
import type { SummaryResult } from '@/lib/summarize-activity'
import { tags } from '@/server/cache/tags'
import { streamAssignmentActivity } from '@/server/repositories/activity.repository'
import { listAssignableUsers } from '@/server/repositories/reference.repository'

export type InsightsSummaryRow = {
  readonly assigneeId: string
  readonly assigneeName: string
  readonly totalAssigned: number
  readonly totalResolved: number
  readonly averageResolutionTimeMs: number | null
  readonly medianResolutionTimeMs: number | null
  readonly resolutionRate: number
}

export type InsightsDto = {
  readonly summaries: readonly InsightsSummaryRow[]
  readonly stats: SummaryResult['stats']
}

export async function getAssigneeInsights(): Promise<InsightsDto> {
  'use cache'
  cacheLife('hours')
  cacheTag(tags.assigneeSummary())

  const [result, assignees] = await Promise.all([
    summarizeActivityStream(streamAssignmentActivity(), { sortBy: 'totalResolved' }),
    listAssignableUsers(),
  ])

  const assigneeNames = new Map(assignees.map((assignee) => [assignee.id, assignee.name]))

  return {
    summaries: result.summaries.map((summary) => ({
      assigneeId: summary.assigneeId,
      assigneeName: assigneeNames.get(summary.assigneeId) ?? summary.assigneeId,
      totalAssigned: summary.totalAssigned,
      totalResolved: summary.totalResolved,
      averageResolutionTimeMs: summary.averageResolutionTimeMs,
      medianResolutionTimeMs: summary.medianResolutionTimeMs,
      resolutionRate: summary.resolutionRate,
    })),
    stats: result.stats,
  }
}
