'use client'

import { ChevronDownIcon } from 'lucide-react'
import { useState } from 'react'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { RejectionReason, SummaryResult } from '@/lib/summarize-activity'
import { cn } from '@/lib/utils'

const REJECTION_LABELS: Record<RejectionReason, string> = {
  MISSING_ASSIGNEE: 'Missing assignee',
  MISSING_REQUEST_ID: 'Missing request ID',
  INVALID_STATUS: 'Invalid status',
  MISSING_ASSIGNED_AT: 'Missing assigned date',
  INVALID_TIMESTAMP: 'Invalid timestamp',
  NEGATIVE_DURATION: 'Resolved before assigned',
  DUPLICATE_RECORD: 'Duplicate request',
}

type RejectedRecordsDisclosureProps = {
  stats: SummaryResult['stats']
}

export function RejectedRecordsDisclosure({ stats }: RejectedRecordsDisclosureProps) {
  const [open, setOpen] = useState(false)

  if (stats.rejected === 0) {
    return null
  }
  const reasons = Object.entries(stats.rejectionsByReason).filter(([, count]) => count > 0)
  const acceptanceRate =
    stats.processed > 0 ? Math.round((stats.accepted / stats.processed) * 100) : 0

  return (
    <section
      className="border-border bg-card overflow-hidden rounded-lg border"
      aria-labelledby="data-quality-heading"
    >
      <div className="border-border border-b px-4 py-4 sm:px-6">
        <h2 id="data-quality-heading" className="text-base font-semibold tracking-tight">
          Data quality
        </h2>
        <p role="status" className="text-muted-foreground mt-1 text-sm text-pretty">
          {stats.accepted.toLocaleString()} of {stats.processed.toLocaleString()} activity records
          were included ({acceptanceRate}%). {stats.rejected.toLocaleString()} were skipped as
          incomplete.
        </p>
      </div>

      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger
          data-testid="rejected-records-trigger"
          className={cn(
            'flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium transition-colors sm:px-6',
            'hover:bg-muted/50 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
          )}
        >
          <span>{open ? 'Hide rejection breakdown' : 'View rejection breakdown'}</span>
          <ChevronDownIcon
            aria-hidden="true"
            className={cn(
              'text-muted-foreground size-4 shrink-0 transition-transform duration-200',
              open && 'rotate-180',
            )}
          />
        </CollapsibleTrigger>

        <CollapsibleContent
          data-testid="rejected-records-content"
          className="border-border space-y-4 border-t px-4 py-4 text-sm sm:px-6"
        >
          <dl className="divide-border divide-y rounded-md border">
            {reasons.map(([reason, count]) => (
              <div
                key={reason}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 px-3 py-2.5"
              >
                <dt>{REJECTION_LABELS[reason as RejectionReason]}</dt>
                <dd className="text-muted-foreground tabular-nums">{count.toLocaleString()}</dd>
              </div>
            ))}
          </dl>

          {stats.rejectedSamples.length > 0 ? (
            <div>
              <h3 className="mb-2 text-sm font-medium">Sample rejected records</h3>
              <ul
                className="bg-muted/40 border-border/60 max-h-48 space-y-1 overflow-y-auto rounded-md border p-3 text-sm"
                aria-label="Sample rejected records"
              >
                {stats.rejectedSamples.map((sample) => (
                  <li
                    key={`${String(sample.index)}-${sample.reason}`}
                    className="text-muted-foreground"
                  >
                    Record #{String(sample.index)}: {REJECTION_LABELS[sample.reason].toLowerCase()}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </CollapsibleContent>
      </Collapsible>
    </section>
  )
}
