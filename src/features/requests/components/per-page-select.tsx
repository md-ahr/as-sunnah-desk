import Link from 'next/link'

import { toRoute } from '@/lib/routes'
import type { SearchParams } from '@/lib/search-params/schema'
import { serialiseSearchParams, withSearchParams } from '@/lib/search-params/schema'
import { cn } from '@/lib/utils'

const PAGE_SIZES = [10, 25, 50, 100] as const

type PerPageSelectProps = {
  params: SearchParams
}

export function PerPageSelect({ params }: PerPageSelectProps) {
  return (
    <nav aria-label="Rows per page" className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Rows</span>
      <div className="flex items-center gap-1">
        {PAGE_SIZES.map((size) => {
          const href = `/requests?${serialiseSearchParams(
            withSearchParams(params, { perPage: size }),
          )}`
          const isCurrent = params.perPage === size

          return (
            <Link
              key={size}
              href={toRoute(href)}
              aria-current={isCurrent ? 'page' : undefined}
              className={cn(
                'inline-flex min-h-9 min-w-9 items-center justify-center rounded-md border px-2 text-sm',
                isCurrent
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:bg-muted',
              )}
            >
              {size}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
