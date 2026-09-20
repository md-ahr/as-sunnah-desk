'use client'

import Link from 'next/link'

import { Button } from '@/components/ui/button'

import './globals.css'

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 text-foreground antialiased">
        <div role="alert" className="mx-auto max-w-md text-center">
          <h1 className="text-lg font-medium">Something went wrong</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            An unexpected error occurred. Try again, or return to the dashboard.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Button type="button" onClick={retry}>Try again</Button>
            <Button variant="outline" render={<Link href="/requests" />}>
              Back to dashboard
            </Button>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-4 overflow-x-auto rounded bg-muted p-3 text-left text-xs">
              {error.message}
            </pre>
          )}
        </div>
      </body>
    </html>
  )
}
