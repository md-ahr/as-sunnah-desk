'use client'

import Link from 'next/link'

import { Button } from '@/components/ui/button'

export default function RequestDetailError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  return (
    <div role="alert" className="mx-auto max-w-md py-16 text-center">
      <h2 className="text-lg font-medium">We could not load this request</h2>
      <p className="text-muted-foreground mt-1 text-sm">
        This is usually temporary. Try again, or return to the dashboard.
      </p>
      <div className="mt-4 flex justify-center gap-2">
        <Button type="button" onClick={retry}>
          Try again
        </Button>
        <Button variant="outline" render={<Link href="/requests" />}>
          Back to dashboard
        </Button>
      </div>
      {process.env.NODE_ENV === 'development' && (
        <pre className="bg-muted mt-4 overflow-x-auto rounded p-3 text-left text-xs">
          {error.message}
        </pre>
      )}
    </div>
  )
}
