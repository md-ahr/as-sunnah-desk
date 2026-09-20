import { P2Quantile } from '@/lib/summarize-activity/p2-quantile'
import { validate } from '@/lib/summarize-activity/validate'
import type {
  ActivityRecord,
  AssigneeSummary,
  RejectionReason,
  SummarizeOptions,
  SummaryResult,
} from '@/lib/summarize-activity/types'

const DEFAULT_RESOLVED_STATUSES = ['resolved', 'closed'] as const

export type Accumulator = {
  totalAssigned: number
  totalResolved: number
  resolutionSum: number
  sketch: P2Quantile
}

export type AccumulationState = {
  accumulators: Map<string, Accumulator>
  rejectionsByReason: Record<RejectionReason, number>
  rejectedSamples: { index: number; reason: RejectionReason }[]
  seenRequestIds: Set<string> | null
  processed: number
  accepted: number
  resolvedStatuses: ReadonlySet<string>
  maxRejectedSamples: number
}

export function createAccumulationState(options: SummarizeOptions): AccumulationState {
  const resolvedStatuses = new Set(
    (options.resolvedStatuses ?? DEFAULT_RESOLVED_STATUSES).map((status) => status.toLowerCase()),
  )

  return {
    accumulators: new Map(),
    rejectionsByReason: createReasonCounters(),
    rejectedSamples: [],
    seenRequestIds: options.dedupeByRequestId === false ? null : new Set(),
    processed: 0,
    accepted: 0,
    resolvedStatuses,
    maxRejectedSamples: options.maxRejectedSamples ?? 50,
  }
}

function createReasonCounters(): Record<RejectionReason, number> {
  return {
    MISSING_ASSIGNEE: 0,
    MISSING_REQUEST_ID: 0,
    INVALID_STATUS: 0,
    MISSING_ASSIGNED_AT: 0,
    INVALID_TIMESTAMP: 0,
    NEGATIVE_DURATION: 0,
    DUPLICATE_RECORD: 0,
  }
}

export function accumulateRecord(state: AccumulationState, record: ActivityRecord): void {
  const index = state.processed
  state.processed += 1

  const validated = validate(record, state.resolvedStatuses, state.seenRequestIds)
  if (validated.reason !== null) {
    state.rejectionsByReason[validated.reason] += 1
    if (state.rejectedSamples.length < state.maxRejectedSamples) {
      state.rejectedSamples.push({ index, reason: validated.reason })
    }
    return
  }

  state.accepted += 1
  const { assigneeId, isResolved, durationMs } = validated

  let acc = state.accumulators.get(assigneeId)
  if (acc === undefined) {
    acc = {
      totalAssigned: 0,
      totalResolved: 0,
      resolutionSum: 0,
      sketch: new P2Quantile(0.5),
    }
    state.accumulators.set(assigneeId, acc)
  }

  acc.totalAssigned += 1
  if (isResolved && durationMs !== null) {
    acc.totalResolved += 1
    acc.resolutionSum += durationMs
    acc.sketch.accept(durationMs)
  }
}

function finaliseSummaries(
  accumulators: Map<string, Accumulator>,
  sortBy?: SummarizeOptions['sortBy'],
): AssigneeSummary[] {
  const summaries = [...accumulators.entries()].map(([assigneeId, acc]) => {
    const averageResolutionTimeMs =
      acc.totalResolved > 0 ? acc.resolutionSum / acc.totalResolved : null
    const medianResolutionTimeMs = acc.totalResolved > 0 ? acc.sketch.estimate : null
    const resolutionRate = acc.totalAssigned > 0 ? acc.totalResolved / acc.totalAssigned : 0

    return {
      assigneeId,
      totalAssigned: acc.totalAssigned,
      totalResolved: acc.totalResolved,
      averageResolutionTimeMs,
      medianResolutionTimeMs,
      resolutionRate,
    }
  })

  if (sortBy === undefined) {
    return summaries
  }

  return summaries.sort((left, right) => compareSummaries(left, right, sortBy))
}

function compareSummaries(
  left: AssigneeSummary,
  right: AssigneeSummary,
  sortBy: NonNullable<SummarizeOptions['sortBy']>,
): number {
  const leftValue = left[sortBy]
  const rightValue = right[sortBy]

  if (leftValue === null && rightValue === null) {
    return left.assigneeId.localeCompare(right.assigneeId)
  }
  if (leftValue === null) {
    return 1
  }
  if (rightValue === null) {
    return -1
  }
  if (leftValue === rightValue) {
    return left.assigneeId.localeCompare(right.assigneeId)
  }
  return rightValue - leftValue
}

export function toSummaryResult(
  state: AccumulationState,
  sortBy?: SummarizeOptions['sortBy'],
): SummaryResult {
  const rejected = state.processed - state.accepted

  return {
    summaries: finaliseSummaries(state.accumulators, sortBy),
    stats: {
      processed: state.processed,
      accepted: state.accepted,
      rejected,
      rejectionsByReason: state.rejectionsByReason,
      rejectedSamples: state.rejectedSamples,
    },
  }
}
