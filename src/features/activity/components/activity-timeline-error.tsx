'use client'

import { catchError } from 'next/error'

import { Button } from '@/components/ui/button'

function ActivityTimelineFallback(_props: object, { retry }: { retry: () => void }) {
  return (
    <section role="alert" className="border-border bg-card rounded-lg border p-6">
      <h2 className="text-lg font-medium">Activity could not be loaded</h2>
      <p className="text-muted-foreground mt-1 text-sm">
        Request details above are still available. Try loading the history again.
      </p>
      <Button type="button" className="mt-4" onClick={retry}>
        Try again
      </Button>
    </section>
  )
}

export const ActivityTimelineErrorBoundary = catchError(ActivityTimelineFallback)
