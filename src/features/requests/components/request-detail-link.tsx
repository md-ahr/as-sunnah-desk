import { ChevronRightIcon } from 'lucide-react'
import Link from 'next/link'

import { toRoute } from '@/lib/routes'
import { cn } from '@/lib/utils'

type RequestDetailLinkProps = {
  reference: string
  subject: string
  className?: string
}

function requestDetailLabel(reference: string, subject: string): string {
  return `View details for ${reference}: ${subject}`
}

export function RequestDetailLink({ reference, subject, className }: RequestDetailLinkProps) {
  return (
    <Link
      href={toRoute(`/requests/${reference}`)}
      prefetch
      aria-label={requestDetailLabel(reference, subject)}
      className={cn(
        'text-primary inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium transition-colors',
        'hover:bg-muted/80 hover:underline',
        className,
      )}
    >
      <span className="md:hidden">View details</span>
      <span aria-hidden="true" className="hidden md:inline">
        View
      </span>
      <ChevronRightIcon aria-hidden="true" className="size-4 shrink-0" />
    </Link>
  )
}
