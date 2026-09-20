import { describe, expect, it } from 'vitest'

import { summarizeActivityByAssignee, summarizeActivityStream } from '@/lib/summarize-activity'
import type { ActivityRecord } from '@/lib/summarize-activity'

const BASE_TIME = Date.parse('2026-01-01T00:00:00.000Z')

function record(overrides: Partial<ActivityRecord> = {}): ActivityRecord {
  return {
    assigneeId: 'agent-1',
    requestId: 'req-1',
    status: 'resolved',
    assignedAt: BASE_TIME,
    resolvedAt: BASE_TIME + 3_600_000,
    ...overrides,
  }
}

function recordsToAsyncIterable(records: readonly ActivityRecord[]): AsyncIterable<ActivityRecord> {
  return {
    [Symbol.asyncIterator]() {
      let index = 0
      return {
        next() {
          if (index >= records.length) {
            return Promise.resolve({ done: true as const, value: undefined })
          }
          const value = records[index]
          index += 1
          if (value === undefined) {
            return Promise.resolve({ done: true as const, value: undefined })
          }
          return Promise.resolve({ done: false as const, value })
        },
      }
    },
  }
}

describe('summarizeActivityByAssignee', () => {
  it('produces hand-calculated totals on a known fixture', () => {
    const records = [
      record({ requestId: 'req-1', assigneeId: 'agent-1', resolvedAt: BASE_TIME + 2_000 }),
      record({ requestId: 'req-2', assigneeId: 'agent-1', resolvedAt: BASE_TIME + 4_000 }),
      record({
        requestId: 'req-3',
        assigneeId: 'agent-2',
        status: 'in_progress',
        resolvedAt: null,
      }),
    ]

    const result = summarizeActivityByAssignee(records)

    expect(result.stats).toMatchObject({
      processed: 3,
      accepted: 3,
      rejected: 0,
    })

    const agentOne = result.summaries.find((summary) => summary.assigneeId === 'agent-1')
    expect(agentOne).toMatchObject({
      totalAssigned: 2,
      totalResolved: 2,
      averageResolutionTimeMs: 3_000,
      resolutionRate: 1,
    })

    const agentTwo = result.summaries.find((summary) => summary.assigneeId === 'agent-2')
    expect(agentTwo).toMatchObject({
      totalAssigned: 1,
      totalResolved: 0,
      averageResolutionTimeMs: null,
      medianResolutionTimeMs: null,
      resolutionRate: 0,
    })
  })

  it('returns empty summaries for empty input', () => {
    const result = summarizeActivityByAssignee([])

    expect(result.summaries).toEqual([])
    expect(result.stats).toMatchObject({
      processed: 0,
      accepted: 0,
      rejected: 0,
    })
  })

  it('rejects missing assignee identifiers', () => {
    const result = summarizeActivityByAssignee([
      record({ assigneeId: null }),
      record({ assigneeId: undefined }),
      record({ assigneeId: '' }),
      record({ assigneeId: '   ' }),
    ])

    expect(result.stats.accepted).toBe(0)
    expect(result.stats.rejected).toBe(4)
    expect(result.stats.rejectionsByReason.MISSING_ASSIGNEE).toBe(4)
  })

  it('rejects invalid timestamps and negative durations', () => {
    const result = summarizeActivityByAssignee([
      record({ requestId: 'bad-ts', resolvedAt: 'not-a-date' }),
      record({ requestId: 'infinity', resolvedAt: Number.POSITIVE_INFINITY }),
      record({ requestId: 'negative', resolvedAt: BASE_TIME - 1 }),
      record({ requestId: 'invalid-date', resolvedAt: new Date('invalid') }),
    ])

    expect(result.stats.rejectionsByReason.INVALID_TIMESTAMP).toBe(3)
    expect(result.stats.rejectionsByReason.NEGATIVE_DURATION).toBe(1)
    expect(result.stats.rejectedSamples.length).toBeLessThanOrEqual(50)
  })

  it('deduplicates by request id and records duplicate rejections', () => {
    const result = summarizeActivityByAssignee([
      record({ requestId: 'dup' }),
      record({ requestId: 'dup', assigneeId: 'agent-2' }),
    ])

    expect(result.stats.accepted).toBe(1)
    expect(result.stats.rejectionsByReason.DUPLICATE_RECORD).toBe(1)
  })

  it('accepts mixed timestamp formats for the same instant', () => {
    const iso = '2026-01-02T12:00:00.000Z'
    const epoch = Date.parse(iso)

    const result = summarizeActivityByAssignee([
      record({
        requestId: 'epoch',
        assignedAt: epoch,
        resolvedAt: epoch + 1_000,
      }),
      record({
        requestId: 'iso',
        assignedAt: iso,
        resolvedAt: new Date(epoch + 1_000),
      }),
    ])

    const summary = result.summaries.find((row) => row.assigneeId === 'agent-1')
    expect(summary?.totalAssigned).toBe(2)
    expect(summary?.averageResolutionTimeMs).toBe(1_000)
  })

  it('caps rejected samples when every record is invalid', () => {
    const records = Array.from({ length: 200 }, (_, index) =>
      record({ requestId: `bad-${String(index)}`, assigneeId: null }),
    )

    const result = summarizeActivityByAssignee(records, { maxRejectedSamples: 10 })

    expect(result.stats.accepted).toBe(0)
    expect(result.stats.rejected).toBe(200)
    expect(result.stats.rejectedSamples).toHaveLength(10)
  })

  it('works with generator input without materialising an array', () => {
    function* generate() {
      yield record({ requestId: 'gen-1' })
      yield record({ requestId: 'gen-2', status: 'closed' })
    }

    const result = summarizeActivityByAssignee(generate())

    expect(result.stats.accepted).toBe(2)
    expect(result.summaries[0]?.totalResolved).toBe(2)
  })

  it('sorts summaries by each sort option', () => {
    const records = [
      record({ requestId: 'a', assigneeId: 'slow', resolvedAt: BASE_TIME + 10_000 }),
      record({ requestId: 'b', assigneeId: 'fast', resolvedAt: BASE_TIME + 1_000 }),
      record({ requestId: 'c', assigneeId: 'open', status: 'new', resolvedAt: null }),
    ]

    const byAssigned = summarizeActivityByAssignee(records, { sortBy: 'totalAssigned' })
    expect(byAssigned.summaries.map((row) => row.assigneeId)).toEqual(['fast', 'open', 'slow'])

    const byResolved = summarizeActivityByAssignee(records, { sortBy: 'totalResolved' })
    expect(byResolved.summaries.map((row) => row.assigneeId)).toEqual(['fast', 'slow', 'open'])

    const byAverage = summarizeActivityByAssignee(records, { sortBy: 'averageResolutionTimeMs' })
    expect(byAverage.summaries.map((row) => row.assigneeId)).toEqual(['slow', 'fast', 'open'])
  })

  it('estimates median within 2% of the exact median on a log-normal sample', () => {
    const durations = Array.from({ length: 10_000 }, (_, index) => {
      const value = Math.exp(Math.log(3_600_000) + (index % 97) / 50)
      return value
    })

    const records = durations.map((duration, index) =>
      record({
        requestId: `median-${String(index)}`,
        resolvedAt: BASE_TIME + duration,
      }),
    )

    const result = summarizeActivityByAssignee(records)
    const summary = result.summaries[0]
    const sortedDurations = [...durations].sort((a, b) => a - b)
    const exactMedian = sortedDurations[Math.floor(durations.length / 2)] ?? 0

    expect(summary?.medianResolutionTimeMs).not.toBeNull()
    const estimate = summary?.medianResolutionTimeMs ?? 0
    const error = exactMedian === 0 ? 0 : Math.abs(estimate - exactMedian) / exactMedian
    expect(error).toBeLessThan(0.02)
  })

  it('summarizes 100,000 records under 250 ms with bounded heap growth', () => {
    const assigneeCount = 200
    const heapBefore = process.memoryUsage().heapUsed

    const records = Array.from({ length: 100_000 }, (_, index) =>
      record({
        assigneeId: `agent-${String(index % assigneeCount)}`,
        requestId: `req-${String(index)}`,
        status: index % 3 === 0 ? 'resolved' : 'in_progress',
        resolvedAt: index % 3 === 0 ? BASE_TIME + (index % 500) * 1_000 : null,
      }),
    )

    const start = performance.now()
    const result = summarizeActivityByAssignee(records)
    const elapsed = performance.now() - start
    const heapAfter = process.memoryUsage().heapUsed

    expect(elapsed).toBeLessThan(250)
    expect(result.summaries).toHaveLength(assigneeCount)
    expect(heapAfter - heapBefore).toBeLessThan(50 * 1024 * 1024)
  })
})

describe('summarizeActivityStream', () => {
  it('matches the sync variant on identical fixtures', async () => {
    const records = [
      record({ requestId: 'stream-1' }),
      record({ requestId: 'stream-2', status: 'closed', resolvedAt: BASE_TIME + 9_000 }),
      record({ requestId: 'stream-3', assigneeId: null }),
      record({ requestId: 'stream-4', status: 'new', resolvedAt: null }),
    ]

    const sync = summarizeActivityByAssignee(records)
    const asyncResult = await summarizeActivityStream(recordsToAsyncIterable(records))

    expect(asyncResult).toEqual(sync)
  })
})
