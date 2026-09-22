import {
  accumulateRecord,
  createAccumulationState,
  toSummaryResult,
} from '@/lib/summarize-activity/accumulate'
import type {
  ActivityRecord,
  SummarizeOptions,
  SummaryResult,
} from '@/lib/summarize-activity/types'

export function summarizeActivityByAssignee(
  records: Iterable<ActivityRecord>,
  options: SummarizeOptions = {},
): SummaryResult {
  const state = createAccumulationState(options)

  for (const record of records) {
    accumulateRecord(state, record)
  }

  return toSummaryResult(state, options.sortBy)
}
