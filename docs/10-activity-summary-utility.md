# 10 · Activity Summary Utility

> _Include a utility that summarizes a large activity dataset per assignee, returning total assigned, total resolved and average resolution time while handling incomplete/invalid records efficiently._

This is the "advanced JavaScript" requirement. The interesting words are **large**, **efficiently**, and **handling incomplete/invalid records** — a naive `filter().map().reduce()` chain satisfies the description and fails all three.

## What a naive implementation gets wrong

```js
// Plausible, and wrong in four ways
function summarize(records) {
  const assignees = [...new Set(records.map((r) => r.assigneeId))]
  return assignees.map((id) => {
    const theirs = records.filter((r) => r.assigneeId === id)
    const resolved = theirs.filter((r) => r.status === 'resolved')
    return {
      assigneeId: id,
      totalAssigned: theirs.length,
      totalResolved: resolved.length,
      avgResolutionTime:
        resolved.reduce((s, r) => s + (r.resolvedAt - r.createdAt), 0) / resolved.length,
    }
  })
}
```

1. **O(n·k).** `filter` runs once per assignee over the whole dataset. At 500,000 records and 200 assignees that is 100 million comparisons.
2. **Memory.** Every `map` and `filter` allocates a new array. Four intermediate arrays per assignee.
3. **Silent `NaN` propagation.** One record with a missing `resolvedAt` makes `avgResolutionTime` `NaN` for that assignee, with no indication of why.
4. **`0/0 = NaN`.** An assignee with no resolved requests produces `NaN` rather than a meaningful zero or null.
5. It requires the whole dataset in memory as an array, so it cannot consume a stream.

## Contract

```ts
// lib/summarize-activity/types.ts

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
  readonly resolvedStatuses?: readonly string[] // default: ['resolved', 'closed']
  readonly now?: number
  readonly maxRejectedSamples?: number // default: 50
  readonly sortBy?: 'totalAssigned' | 'totalResolved' | 'averageResolutionTimeMs'
  readonly dedupeByRequestId?: boolean // default: true
}
```

Three decisions embedded in this contract:

**`averageResolutionTimeMs` is `number | null`, never `NaN`.** `NaN` propagates silently through arithmetic and renders as "NaN" in the UI. `null` is a value the type system forces the caller to handle.

**Rejections are counted and reported, not silently dropped.** "Handling invalid records" does not mean ignoring them. If 30% of a dataset is being discarded, the caller needs to know — that is a data quality signal, not an implementation detail. Samples are bounded so a fully invalid 500,000-record dataset does not accumulate 500,000 error objects and exhaust memory while reporting on a memory-efficient algorithm.

**Input types are permissive.** `number | string | Date | null` reflects reality: timestamps arrive as epoch numbers from SQLite, ISO strings from JSON APIs, and `Date` objects from an ORM. Normalising at the boundary is the utility's job.

## Algorithm

Single pass, `Map` accumulator, no intermediate arrays.

```ts
// lib/summarize-activity/summarize.ts

type Accumulator = {
  totalAssigned: number
  totalResolved: number
  resolutionSum: number
  sketch: P2Quantile // bounded-memory median
}

export function summarizeActivityByAssignee(
  records: Iterable<ActivityRecord>,
  options: SummarizeOptions = {},
): SummaryResult {
  const {
    resolvedStatuses = DEFAULT_RESOLVED_STATUSES,
    maxRejectedSamples = 50,
    dedupeByRequestId = true,
  } = options

  // Set lookup, not Array.includes — O(1) per record instead of O(s)
  const resolved = new Set(resolvedStatuses)

  const accumulators = new Map<string, Accumulator>()
  const rejectionsByReason = createReasonCounters()
  const rejectedSamples: { index: number; reason: RejectionReason }[] = []
  const seenRequestIds = dedupeByRequestId ? new Set<string>() : null

  let processed = 0
  let accepted = 0

  for (const record of records) {
    const index = processed++

    const validated = validate(record, resolved, seenRequestIds)
    if (validated.reason !== null) {
      rejectionsByReason[validated.reason]++
      if (rejectedSamples.length < maxRejectedSamples) {
        rejectedSamples.push({ index, reason: validated.reason })
      }
      continue
    }

    accepted++
    const { assigneeId, isResolved, durationMs } = validated

    let acc = accumulators.get(assigneeId)
    if (acc === undefined) {
      acc = { totalAssigned: 0, totalResolved: 0, resolutionSum: 0, sketch: new P2Quantile(0.5) }
      accumulators.set(assigneeId, acc)
    }

    acc.totalAssigned++
    if (isResolved && durationMs !== null) {
      acc.totalResolved++
      acc.resolutionSum += durationMs
      acc.sketch.accept(durationMs)
    }
  }

  return { summaries: finalise(accumulators, options.sortBy), stats: {/* ... */} }
}
```

### Properties

| Property    | Value                              | Why                                                             |
| ----------- | ---------------------------------- | --------------------------------------------------------------- |
| Time        | **O(n)**                           | One pass. Every lookup is a `Map`/`Set` hash, so O(1) amortised |
| Memory      | **O(k)** in assignees, not records | Accumulators only. Nothing retains the input                    |
| Allocations | One accumulator per assignee       | No intermediate arrays, no closures in the hot loop             |
| Input       | Any `Iterable`                     | Arrays, `Set`s, generators, database cursors                    |

`O(k)` memory rather than `O(n)` is the property that matters most. A per-assignee array of durations would grow with the dataset; the accumulator does not. 500,000 records across 200 assignees holds 200 small objects.

### The median without storing durations

A median normally requires all values, which would reintroduce O(n) memory. Instead, the **P² algorithm** estimates a quantile from five running markers in constant space:

```ts
// lib/summarize-activity/p2-quantile.ts
/**
 * Jain & Chlamtac (1985) P-square algorithm.
 * Estimates a quantile in O(1) memory and O(1) time per observation
 * by maintaining five markers and adjusting them with a parabolic fit.
 */
export class P2Quantile {
  #markers: number[] = []
  #positions: number[] = []
  // ...
  accept(value: number): void {
    /* ... */
  }
  get estimate(): number | null {
    /* ... */
  }
}
```

The median earns its place because resolution times are strongly right-skewed — a handful of requests that sat open for months pull the mean well above what a typical resolution actually takes. Reporting only the mean gives a misleading picture of team performance, which is the whole purpose of the summary.

**Trade-off:** P² is an estimate, typically within 1–2% on smooth distributions. Exact medians would cost O(n) memory. For a dashboard metric that is the right trade, and the field name does not overclaim.

### Validation

Ordered cheapest-check-first, so the common rejection paths exit before any parsing:

```ts
function validate(record, resolvedStatuses, seenRequestIds) {
  // 1. Presence — string checks, no allocation
  const assigneeId = normaliseId(record.assigneeId)
  if (assigneeId === null) return REJECT.MISSING_ASSIGNEE

  const requestId = normaliseId(record.requestId)
  if (requestId === null) return REJECT.MISSING_REQUEST_ID

  // 2. Deduplication — one Set lookup
  if (seenRequestIds !== null) {
    if (seenRequestIds.has(requestId)) return REJECT.DUPLICATE_RECORD
    seenRequestIds.add(requestId)
  }

  // 3. Timestamps — parse only once the record is otherwise viable
  const assignedAt = toEpochMs(record.assignedAt)
  if (assignedAt === null) return REJECT.MISSING_ASSIGNED_AT

  const status = typeof record.status === 'string' ? record.status.toLowerCase() : null
  if (status === null) return REJECT.INVALID_STATUS

  const isResolved = resolvedStatuses.has(status)
  if (!isResolved) return { reason: null, assigneeId, isResolved: false, durationMs: null }

  const resolvedAt = toEpochMs(record.resolvedAt)
  if (resolvedAt === null) return REJECT.INVALID_TIMESTAMP

  // 4. Semantic sanity — resolved before assigned means corrupt data
  const durationMs = resolvedAt - assignedAt
  if (durationMs < 0) return REJECT.NEGATIVE_DURATION

  return { reason: null, assigneeId, isResolved: true, durationMs }
}
```

`NEGATIVE_DURATION` is the check most implementations miss. A record resolved before it was assigned is corrupt, and admitting it drags the mean downward — possibly negative — while every individual value still looks like a plausible number. It is the kind of bad data that produces a wrong answer rather than an error.

Timestamp normalisation handles the three real-world shapes and rejects the failure cases:

```ts
function toEpochMs(value: number | string | Date | null | undefined): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (value instanceof Date) {
    const ms = value.getTime()
    return Number.isNaN(ms) ? null : ms // Invalid Date
  }
  if (typeof value === 'string') {
    const ms = Date.parse(value)
    return Number.isNaN(ms) ? null : ms
  }
  return null
}
```

`Number.isFinite` rejects `Infinity` and `NaN`, which arithmetic would otherwise propagate. `new Date('nonsense').getTime()` is `NaN`, which is why the `Date` branch checks rather than trusting the type.

## The streaming variant

For datasets too large to hold in memory, an async variant consumes an async iterable and yields to the event loop periodically so it never blocks:

```ts
// lib/summarize-activity/summarize-stream.ts
export async function summarizeActivityStream(
  records: AsyncIterable<ActivityRecord>,
  options: SummarizeOptions & { yieldEvery?: number } = {},
): Promise<SummaryResult> {
  const { yieldEvery = 10_000 } = options
  // ... identical accumulation logic
  for await (const record of records) {
    // ...
    if (processed % yieldEvery === 0) {
      await new Promise((resolve) => setImmediate(resolve))
    }
  }
}
```

The accumulation logic is shared, not duplicated — the sync and async variants differ only in how they iterate and in the yield. Two copies of the aggregation would inevitably drift.

Yielding every 10,000 records matters on a server: a tight loop over a million records blocks the Node.js event loop for hundreds of milliseconds, during which every other request stalls. `setImmediate` lets the loop drain.

In a browser context the equivalent is `scheduler.yield()`, or moving the work to a Web Worker. Not needed here, because this runs server-side.

## How it is used

```tsx
// app/(portal)/insights/page.tsx
import { cacheLife, cacheTag } from 'next/cache'
import { summarizeActivityStream } from '@/lib/summarize-activity'
import { streamAssignmentActivity } from '@/server/repositories/activity.repository'

async function getAssigneeSummary() {
  'use cache'
  cacheLife('hours')
  cacheTag('assignee-summary')

  // Repository yields rows from a cursor; never materialised as one array
  return summarizeActivityStream(streamAssignmentActivity(), {
    sortBy: 'totalResolved',
  })
}

export default function InsightsPage() {
  return (
    <main>
      <h1>Assignee performance</h1>
      <Suspense fallback={<SummaryTableSkeleton />}>
        <SummaryTable promise={getAssigneeSummary()} />
      </Suspense>
    </main>
  )
}
```

The aggregation is expensive and identical for every user, which makes it the clearest case in the application for `use cache`. It is tagged so a resolution invalidates it.

The UI surfaces the rejection statistics rather than hiding them:

```tsx
{
  stats.rejected > 0 && (
    <p role="status" className="text-muted-foreground text-sm">
      {stats.accepted.toLocaleString()} of {stats.processed.toLocaleString()} activity records were
      included. {stats.rejected.toLocaleString()} were skipped as incomplete.
    </p>
  )
}
```

A dashboard that silently drops 30% of its input and presents the rest as complete is worse than one that shows nothing, because it looks trustworthy. This is the visible payoff for tracking rejections rather than discarding them.

## Tests

| Case                                | Assertion                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------- |
| Happy path                          | Known fixture produces hand-calculated totals and averages                      |
| Empty input                         | `summaries: []`, all counters zero. No throw, no `NaN`                          |
| No resolved records                 | `totalAssigned > 0`, `totalResolved: 0`, `averageResolutionTimeMs: null`        |
| Missing `assigneeId`                | Rejected as `MISSING_ASSIGNEE`, counted, excluded                               |
| `null`, `undefined`, `''` assignee  | All rejected identically                                                        |
| `Invalid Date` / unparseable string | Rejected as `INVALID_TIMESTAMP`                                                 |
| `Infinity` timestamp                | Rejected; never reaches arithmetic                                              |
| Resolved before assigned            | Rejected as `NEGATIVE_DURATION`                                                 |
| Duplicate `requestId`               | Counted once; `DUPLICATE_RECORD` recorded                                       |
| Mixed timestamp formats             | number, ISO string and `Date` for the same instant all agree                    |
| All records invalid                 | `accepted: 0`, samples capped at `maxRejectedSamples`                           |
| Timestamp formats                   | Epoch ms, ISO 8601, `Date` produce identical results                            |
| Median vs exact                     | P² estimate within 2% of an exact median on a 10,000-value log-normal sample    |
| Generator input                     | Works with a generator; never materialises an array                             |
| Async variant                       | Matches the sync variant exactly on the same data                               |
| **100,000 records**                 | Completes under 250 ms; heap growth bounded by assignee count, not record count |
| Sort options                        | Each `sortBy` orders correctly; ties are stable                                 |

The parity test between the sync and async variants is the one that guards against future drift, and the 100,000-record test is what turns "efficient" from an adjective into an assertion.
