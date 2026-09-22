import { FileQuestionIcon } from 'lucide-react'
import type { Route } from 'next'
import Link from 'next/link'

import { SiteLogo } from '@/components/site-logo'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type NotFoundPageProps = {
  title: string
  description: string
  actionLabel: string
  actionHref: Route
  fullPage?: boolean
  statusCode?: string
  headingLevel?: 'h1' | 'h2'
}

export function NotFoundPage({
  title,
  description,
  actionLabel,
  actionHref,
  fullPage = false,
  statusCode,
  headingLevel = 'h1',
}: NotFoundPageProps) {
  const Heading = headingLevel

  const content = (
    <div
      role="status"
      className={cn(
        'text-center',
        fullPage
          ? 'border-border bg-card w-full max-w-md rounded-md border p-8 shadow-sm'
          : 'border-border mx-auto max-w-md rounded-lg border border-dashed px-6 py-16',
      )}
    >
      {fullPage ? (
        <SiteLogo linked={false} showName className="mb-8 justify-center [&_img]:h-10" />
      ) : null}

      {statusCode ? (
        <p
          aria-hidden="true"
          className="text-muted-foreground/35 font-mono text-6xl font-semibold tracking-tighter"
        >
          {statusCode}
        </p>
      ) : null}

      <div
        className={cn(
          'bg-muted mx-auto flex size-12 items-center justify-center rounded-full',
          statusCode ? 'mt-4' : 'mt-0',
        )}
      >
        <FileQuestionIcon aria-hidden="true" className="text-muted-foreground size-6" />
      </div>

      <Heading className="mt-6 text-2xl font-semibold tracking-tight">{title}</Heading>
      <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm">{description}</p>

      <Button className="mt-6" render={<Link href={actionHref} />}>
        {actionLabel}
      </Button>
    </div>
  )

  if (fullPage) {
    return (
      <div className="bg-muted/60 flex min-h-dvh flex-1 flex-col items-center justify-center px-4 py-12">
        {content}
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem-3rem)] items-center justify-center">
      {content}
    </div>
  )
}
