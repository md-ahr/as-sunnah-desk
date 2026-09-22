'use client'

import { catchError } from 'next/error'

import { Button } from '@/components/ui/button'

function ActivityTimelineFallback(_props: object, { retry }: { retry: () => void }) {
  return (
    <section role="alert" className="border-border bg-card rounded-lg border">
      <div className="border-border border-b px-6 py-4">
        <h2 className="text-base font-semibold tracking-tight">Activity could not be loaded</h2>
      </div>
      <div className="p-6">
        <p className="text-muted-foreground text-sm">
          Request details above are still available. Try loading the history again.
        </p>
        <Button type="button" className="mt-4" onClick={retry}>
          Try again
        </Button>
      </div>
    </section>
  )
}

export const ActivityTimelineErrorBoundary = catchError(ActivityTimelineFallback)
