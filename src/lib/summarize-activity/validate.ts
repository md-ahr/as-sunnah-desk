import { normaliseId, toEpochMs } from '@/lib/summarize-activity/normalize'
import type { ActivityRecord, RejectionReason } from '@/lib/summarize-activity/types'

export type ValidatedRecord =
  | { reason: RejectionReason }
  | {
      reason: null
      assigneeId: string
      isResolved: boolean
      durationMs: number | null
    }

export function validate(
  record: ActivityRecord,
  resolvedStatuses: ReadonlySet<string>,
  seenRequestIds: Set<string> | null,
): ValidatedRecord {
  const assigneeId = normaliseId(record.assigneeId)
  if (assigneeId === null) {
    return { reason: 'MISSING_ASSIGNEE' }
  }

  const requestId = normaliseId(record.requestId)
  if (requestId === null) {
    return { reason: 'MISSING_REQUEST_ID' }
  }

  if (seenRequestIds !== null) {
    if (seenRequestIds.has(requestId)) {
      return { reason: 'DUPLICATE_RECORD' }
    }
    seenRequestIds.add(requestId)
  }

  const assignedAt = toEpochMs(record.assignedAt)
  if (assignedAt === null) {
    return { reason: 'MISSING_ASSIGNED_AT' }
  }

  const status = typeof record.status === 'string' ? record.status.toLowerCase() : null
  if (status === null) {
    return { reason: 'INVALID_STATUS' }
  }

  const isResolved = resolvedStatuses.has(status)
  if (!isResolved) {
    return { reason: null, assigneeId, isResolved: false, durationMs: null }
  }

  const resolvedAt = toEpochMs(record.resolvedAt)
  if (resolvedAt === null) {
    return { reason: 'INVALID_TIMESTAMP' }
  }

  const durationMs = resolvedAt - assignedAt
  if (durationMs < 0) {
    return { reason: 'NEGATIVE_DURATION' }
  }

  return { reason: null, assigneeId, isResolved: true, durationMs }
}
