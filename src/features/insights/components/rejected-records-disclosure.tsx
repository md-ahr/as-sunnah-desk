'use client'

import { ChevronDownIcon } from 'lucide-react'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import type { RejectionReason, SummaryResult } from '@/lib/summarize-activity'

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
  if (stats.rejected === 0) {
    return null
  }

  const reasons = Object.entries(stats.rejectionsByReason).filter(([, count]) => count > 0)

  return (
    <section className="space-y-3 rounded-lg border border-border bg-card p-4 shadow-sm">
      <p role="status" className="text-sm text-muted-foreground">
        {stats.accepted.toLocaleString()} of {stats.processed.toLocaleString()} activity records
        were included. {stats.rejected.toLocaleString()} were skipped as incomplete.
      </p>

      <Collapsible>
        <CollapsibleTrigger
          data-testid="rejected-records-trigger"
          className="flex w-full items-center justify-between gap-2 rounded-md px-1 py-2 text-left text-sm font-medium hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          View rejection breakdown
          <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </CollapsibleTrigger>
        <CollapsibleContent
          data-testid="rejected-records-content"
          className="space-y-4 pt-2 text-sm"
        >
          <ul className="space-y-1">
            {reasons.map(([reason, count]) => (
              <li key={reason} className="flex items-center justify-between gap-4">
                <span>{REJECTION_LABELS[reason as RejectionReason]}</span>
                <span className="tabular-nums text-muted-foreground">{count.toLocaleString()}</span>
              </li>
            ))}
          </ul>

          {stats.rejectedSamples.length > 0 && (
            <div>
              <h3 className="mb-2 font-medium">Sample rejected records</h3>
              <ul className="space-y-1 text-muted-foreground">
                {stats.rejectedSamples.map((sample) => (
                  <li key={`${String(sample.index)}-${sample.reason}`}>
                    Record #{String(sample.index)}:{' '}
                    {REJECTION_LABELS[sample.reason].toLowerCase()}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </section>
  )
}
