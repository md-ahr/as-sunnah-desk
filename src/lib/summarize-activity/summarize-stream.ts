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

export async function summarizeActivityStream(
  records: AsyncIterable<ActivityRecord>,
  options: SummarizeOptions & { yieldEvery?: number } = {},
): Promise<SummaryResult> {
  const { yieldEvery = 10_000, ...summarizeOptions } = options
  const state = createAccumulationState(summarizeOptions)

  for await (const record of records) {
    accumulateRecord(state, record)

    if (state.processed % yieldEvery === 0) {
      await new Promise<void>((resolve) => {
        setImmediate(resolve)
      })
    }
  }

  return toSummaryResult(state, summarizeOptions.sortBy)
}
