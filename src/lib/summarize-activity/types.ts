/** The input record. Deliberately permissive — real data is messy. */
export type ActivityRecord = {
  readonly assigneeId?: string | null
  readonly requestId?: string | null
  readonly status?: string | null
  readonly assignedAt?: number | string | Date | null
  readonly resolvedAt?: number | string | Date | null
}

export type AssigneeSummary = {
  readonly assigneeId: string
  readonly totalAssigned: number
  readonly totalResolved: number
  /** Mean resolution time in ms. `null` when nothing resolved — never NaN. */
  readonly averageResolutionTimeMs: number | null
  /** Median, from a bounded-memory sketch. `null` when nothing resolved. */
  readonly medianResolutionTimeMs: number | null
  readonly resolutionRate: number
}

export type RejectionReason =
  | 'MISSING_ASSIGNEE'
  | 'MISSING_REQUEST_ID'
  | 'INVALID_STATUS'
  | 'MISSING_ASSIGNED_AT'
  | 'INVALID_TIMESTAMP'
  | 'NEGATIVE_DURATION'
  | 'DUPLICATE_RECORD'

export type SummaryResult = {
  readonly summaries: readonly AssigneeSummary[]
  readonly stats: {
    readonly processed: number
    readonly accepted: number
    readonly rejected: number
    readonly rejectionsByReason: Readonly<Record<RejectionReason, number>>
    /** Bounded sample for debugging. Never the full rejected set. */
    readonly rejectedSamples: readonly { index: number; reason: RejectionReason }[]
  }
}

export type SummarizeOptions = {
  readonly resolvedStatuses?: readonly string[]
  readonly now?: number
  readonly maxRejectedSamples?: number
  readonly sortBy?: 'totalAssigned' | 'totalResolved' | 'averageResolutionTimeMs'
  readonly dedupeByRequestId?: boolean
}
